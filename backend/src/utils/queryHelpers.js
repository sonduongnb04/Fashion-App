// Tiện ích hỗ trợ truy vấn cho lọc, tìm kiếm, sắp xếp và phân trang
class QueryHelper {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    // Chức năng tìm kiếm
    search() {
        const keyword = this.queryString.keyword;
        if (keyword) {
            this.query = this.query.find({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { tags: { $in: [new RegExp(keyword, 'i')] } }
                ]
            });
        }
        return this;
    }

    // Chức năng lọc
    filter() {
        const queryCopy = { ...this.queryString };

        // Loại bỏ các trường không dùng cho lọc
        const removeFields = ['keyword', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete queryCopy[param]);

        // Lọc nâng cao cho khoảng giá, đánh giá, v.v.
        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    // Chức năng sắp xếp
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            // Sắp xếp mặc định theo ngày tạo (mới nhất trước)
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    // Chức năng phân trang
    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        // Tăng giới hạn mặc định để tránh thiếu dữ liệu khi client không truyền limit
        const limit = parseInt(this.queryString.limit, 10) || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        this.pagination = {
            currentPage: page,
            limit: limit,
            skip: skip
        };

        return this;
    }

    // Lựa chọn trường
    selectFields() {
        if (this.queryString.select) {
            const fields = this.queryString.select.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        return this;
    }

    // Đồng bộ
    populate(populateOptions) {
        if (populateOptions) {
            this.query = this.query.populate(populateOptions);
        }
        return this;
    }
}

// Hàm hỗ trợ xây dựng pipeline aggregation cho truy vấn phức tạp
const buildAggregationPipeline = (options = {}) => {
    const pipeline = [];

    // Giai đoạn match
    if (options.match) {
        pipeline.push({ $match: options.match });
    }

    // Giai đoạn search
    if (options.search) {
        pipeline.push({
            $match: {
                $or: [
                    { name: { $regex: options.search, $options: 'i' } },
                    { description: { $regex: options.search, $options: 'i' } },
                    { tags: { $in: [new RegExp(options.search, 'i')] } }
                ]
            }
        });
    }

    // Giai đoạn lookup/populate
    if (options.lookup) {
        options.lookup.forEach(lookup => {
            pipeline.push({ $lookup: lookup });
        });
    }

    // Giai đoạn sort
    if (options.sort) {
        pipeline.push({ $sort: options.sort });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Giai đoạn facet cho phân trang và đếm tổng
    if (options.paginate) {
        const { page = 1, limit = 10 } = options.paginate;
        const skip = (page - 1) * limit;

        pipeline.push({
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        });
    }

    return pipeline;
};

module.exports = {
    QueryHelper,
    buildAggregationPipeline
};
