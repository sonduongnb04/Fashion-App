const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../src/.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { connectDB } = require('../src/db');

function slugify(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Dữ liệu sản phẩm khớp với ảnh thực tế (50% có giảm giá)
const categoriesData = [
    {
        name: 'Áo',
        slug: 'ao',
        description: 'Bộ sưu tập áo thời trang đa dạng từ áo thun, sơ mi đến khoác',
        products: [
            { name: 'Áo Bad Habits', slug: 'ao-badhabits', description: 'Áo thun Bad Habits unisex phong cách streetwear. Cotton 100% thoáng mát, form rộng thoải mái. In hình chất lượng cao không bong tróc.', price: 259000, originalPrice: 299000, discount: 13, images: ['ao-badhabits.jpg', 'ao-badhabits1.jpg', 'ao-badhabits2.jpg', 'ao-badhabits3.jpg'], colors: ['Đen', 'Trắng', 'Xám'], sizes: ['M', 'L', 'XL'], isFeatured: true },
            { name: 'Áo Khoác Da Coolcrew', slug: 'ao-khoac-da-chan-bong-coolcrew', description: 'Áo khoác da chần bông Coolcrew unisex ấm áp, bền đẹp. Thiết kế phong cách biker jacket, lót lông êm ái. Form rộng oversized trendy.', price: 899000, originalPrice: 1299000, discount: 31, images: ['ao-khoac-da-chan-bong-coolcrew-unisex.jpg', 'ao-khoac-da-chan-bong-coolcrew-unisex1.jpg', 'ao-khoac-da-chan-bong-coolcrew-unisex2.jpg', 'ao-khoac-da-chan-bong-coolcrew-unisex3.jpg'], colors: ['Đen', 'Nâu'], sizes: ['L', 'XL'], isFeatured: true },
            { name: 'Áo Khoác Flanel', slug: 'ao-khoac-flanel', description: 'Áo khoác flanel họa tiết kẻ caro phong cách retro. Chất vải flanel dày dặn, mềm mại. Phù hợp mùa thu đông, dễ phối đồ.', price: 449000, originalPrice: 599000, discount: 25, images: ['ao-khoac-flanel.jpg', 'ao-khoac-flanel1.jpg', 'ao-khoac-flanel2.jpg', 'ao-khoac-flanel3.jpg'], colors: ['Đỏ đen', 'Xanh đen', 'Nâu'], sizes: ['M', 'L', 'XL'], isFeatured: false },
            { name: 'Áo Khoác Hades', slug: 'ao-khoac-hades', description: 'Áo khoác Hades streetwear Hàn Quốc. Chống nước tốt, lót lưới thoáng mát. Nhiều túi tiện lợi, form oversized.', price: 549000, originalPrice: 549000, discount: 0, images: ['ao-khoac-hades.webp', 'ao-khoac-hades1.webp', 'ao-khoac-hades2.webp', 'ao-khoac-hades3.webp'], colors: ['Đen', 'Xám', 'Xanh rêu'], sizes: ['L', 'XL'], isFeatured: true },
            { name: 'Áo Khoác Jean', slug: 'ao-khoac-jean', description: 'Áo khoác jean phong cách Hàn Quốc, denim cao cấp. Basic với túi tiện dụng, form rộng. Mix-match dễ dàng.', price: 449000, originalPrice: 599000, discount: 25, images: ['ao-khoac-jean.webp', 'ao-khoac-jean1.webp', 'ao-khoac-jean2.webp', 'ao-khoac-jean3.webp'], colors: ['Xanh denim', 'Đen', 'Xanh nhạt'], sizes: ['S', 'M', 'L', 'XL'], isFeatured: true },
            { name: 'Áo Khoác Kaki Godmother', slug: 'ao-khoac-kaki-godmother', description: 'Áo khoác kaki khóa kéo form crop Godmother. Thiết kế trẻ trung, năng động. Chất kaki cao cấp, bền đẹp.', price: 399000, originalPrice: 549000, discount: 27, images: ['ao-khoac-kaki-khoa-keo-form-crop-godmothe.jpg', 'ao-khoac-kaki-khoa-keo-form-crop-godmother1.jpg', 'ao-khoac-kaki-khoa-keo-form-crop-godmother2.jpg', 'ao-khoac-kaki-khoa-keo-form-crop-godmother3.jpg'], colors: ['Be', 'Đen', 'Xanh rêu'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Áo Levents', slug: 'ao-levents', description: 'Áo Levents với thiết kế tối giản, logo thêu. Cotton 100% cao cấp, mềm mịn. Form basic dễ phối.', price: 349000, originalPrice: 349000, discount: 0, images: ['mikenco00.webp', 'ao-levents1.webp', 'ao-levents2.webp', 'ao-levents3.webp'], colors: ['Trắng', 'Đen', 'Xám'], sizes: ['S', 'M', 'L', 'XL'], isFeatured: false },
            { name: 'Áo Mikenco', slug: 'ao-mikenco', description: 'Áo Mikenco phong cách tối giản. Chất liệu cotton cao cấp, form rộng thoải mái. Dễ phối đồ hàng ngày.', price: 309000, originalPrice: 429000, discount: 28, images: ['ao-mikenco.webp', 'ao-mikenco1.webp', 'ao-mikenco2.webp', 'ao-mikenco3.webp'], colors: ['Trắng', 'Đen', 'Be'], sizes: ['M', 'L', 'XL'], isFeatured: false },
            { name: 'Áo Sơ Mi Nam', slug: 'ao-so-mi', description: 'Áo sơ mi nam cotton cao cấp. Thiết kế hiện đại, may tỉ mỉ. Form regular fit, phù hợp đi làm và dạo phố.', price: 299000, originalPrice: 299000, discount: 0, images: ['ao-so-mi.webp', 'ao-so-mi1.webp', 'ao-so-mi2.webp', 'ao-so-mi3.webp'], colors: ['Trắng', 'Xanh navy', 'Đen'], sizes: ['S', 'M', 'L', 'XL'], isFeatured: true },
            { name: 'Áo Thun Dirtycoins', slug: 'ao-thun-dirtycoins', description: 'Áo thun Dirtycoins cotton thấm hút tốt. Logo in/thêu chất lượng. Form regular fit thoải mái.', price: 249000, originalPrice: 249000, discount: 0, images: ['ao-thun-dirtycoins.webp', 'ao-thun-dirtycoins1.webp', 'ao-thun-dirtycoins2.webp', 'ao-thun-dirtycoins3.webp'], colors: ['Đen', 'Trắng', 'Xám'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Cuban Shirt', slug: 'cuban-shirt', description: 'Cuban Shirt họa tiết tropical độc đáo. Vải rayon mềm mát. Cổ trụ cổ điển, form rộng resort style.', price: 379000, originalPrice: 499000, discount: 24, images: ['cuban-shirt.webp', 'cuban-shirt1.webp', 'cuban-shirt2.webp', 'cuban-shirt3.webp'], colors: ['Xanh', 'Cam', 'Đen trắng'], sizes: ['M', 'L', 'XL'], isFeatured: true },
            { name: 'Jacket Dù', slug: 'jacket-du', description: 'Jacket dù chống nước, nhẹ nhàng. Thiết kế sporty năng động. Phù hợp mùa mưa và hoạt động ngoài trời.', price: 349000, originalPrice: 349000, discount: 0, images: ['jacket-du.webp', 'jacket-du1.webp', 'jacket-du2.webp', 'jacket-du3.webp'], colors: ['Đen', 'Xám', 'Xanh navy'], sizes: ['M', 'L', 'XL'], isFeatured: false },
            { name: 'Mikenco 00', slug: 'mikenco00', description: 'Mikenco 00 limited edition. Thiết kế đặc biệt, chất lượng cao. Form rộng phong cách streetwear.', price: 359000, originalPrice: 499000, discount: 28, images: ['mikenco00.webp', 'mikenco00-1.webp', 'mikenco00-2.webp', 'mikenco00-3.webp'], colors: ['Trắng', 'Đen'], sizes: ['M', 'L', 'XL'], isFeatured: false },
            { name: 'Áo Polo Dirtycoins', slug: 'polo-dirtycoins', description: 'Polo Dirtycoins pique cotton. Cổ bẻ thanh lịch, slim fit tôn dáng. Phù hợp công sở và dạo phố.', price: 249000, originalPrice: 249000, discount: 0, images: ['polo-dirtycoins.webp', 'polo-dirtycoins1.webp', 'polo-dirtycoins2.webp', 'polo-dirtycoins3.webp'], colors: ['Đen', 'Trắng', 'Xanh navy'], sizes: ['S', 'M', 'L', 'XL'], isFeatured: false },
            { name: 'Áo Polo Levents', slug: 'polo-levents', description: 'Polo Levents basic cao cấp. Cotton pique thoáng mát. Logo thêu tinh tế, form regular fit.', price: 279000, originalPrice: 279000, discount: 0, images: ['polo-levents.webp', 'mikenco00-1.webp', 'mikenco00-2.webp', 'mikenco00-3.webp'], colors: ['Đen', 'Trắng', 'Xám'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Áo Thun Hades', slug: 'tee-den-hades', description: 'Áo thun Hades thiết kế đơn giản cá tính. Cotton pha spandex co giãn. Form regular fit phù hợp nhiều vóc dáng.', price: 245000, originalPrice: 350000, discount: 30, images: ['tee-den-hades.webp', 'tee-den-hades1.webp', 'tee-den-hades2.webp', 'tee-den-hades3.webp'], colors: ['Đen', 'Xám', 'Be'], sizes: ['M', 'L', 'XL'], isFeatured: false }
        ]
    },
    {
        name: 'Quần',
        slug: 'quan',
        description: 'Bộ sưu tập quần từ jeans, kaki đến short đa dạng',
        products: [
            { name: 'Jean Nữ', slug: 'jean-nu', description: 'Jean nữ skinny ôm body tôn dáng. Denim co giãn tốt, thoải mái. Túi sau thiết kế nâng mông.', price: 399000, originalPrice: 549000, discount: 27, images: ['jean-nu.webp', 'jean-nu1.webp', 'jean-nu2.webp', 'jean-nu3.webp'], colors: ['Xanh đậm', 'Đen', 'Xám'], sizes: ['25', '26', '27', '28', '29'], isFeatured: true },
            { name: 'Quần Jean Nam', slug: 'quan-jean-nam', description: 'Jean nam slim fit denim co giãn 4 chiều. Ôm vừa tôn dáng, form chuẩn. Màu xanh bền đẹp.', price: 449000, originalPrice: 449000, discount: 0, images: ['quan-jean-nam.webp', 'quan-jean-nam1.webp', 'quan-jean-nam2.webp', 'quan-jean-nam3.webp'], colors: ['Xanh đậm', 'Xanh nhạt', 'Đen'], sizes: ['28', '29', '30', '31', '32'], isFeatured: true },
            { name: 'Quần Jean Rách Gối', slug: 'quan-jean-rach-goi', description: 'Jean rách gối phong cách destroyed. Form baggy rộng thoải mái. Rách tỉ mỉ cá tính streetwear.', price: 499000, originalPrice: 699000, discount: 29, images: ['quan-jean-rach-goi.webp', 'quan-jean-rach-goi1.webp', 'quan-jean-rach-goi2.webp', 'quan-jean-rach-goi3.webp'], colors: ['Xanh nhạt', 'Xanh đậm'], sizes: ['28', '29', '30', '31'], isFeatured: true },
            { name: 'Quần Kaki Nữ', slug: 'quan-kaki-nu-tron', description: 'Kaki nữ thanh lịch công sở. Co giãn nhẹ, thoáng mát ít nhăn. Form ống đứng dáng dài vừa.', price: 349000, originalPrice: 349000, discount: 0, images: ['quan-kaki-nu-tron.webp', 'quan-kaki-nu-tron1.webp', 'quan-kaki-nu-tron2.webp', 'quan-kaki-nu-tron3.webp'], colors: ['Be', 'Đen', 'Xám', 'Xanh navy'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Quần Nỉ Caro', slug: 'quan-ni-caro', description: 'Quần nỉ caro ấm áp mùa đông. Chất nỉ dày dặn mềm mại. Họa tiết caro trendy, form rộng.', price: 329000, originalPrice: 429000, discount: 23, images: ['quan-ni-caro.webp', 'quan-ni-caro1.webp', 'quan-ni-caro2.webp', 'quan-ni-caro3.webp'], colors: ['Đen trắng', 'Nâu', 'Xám'], sizes: ['M', 'L', 'XL'], isFeatured: false },
            { name: 'Quần Nữ Masara', slug: 'quan-nu-masara', description: 'Quần nữ Masara thiết kế hiện đại. Chất vải mềm rơi đẹp. Form suông thanh lịch, dễ phối.', price: 369000, originalPrice: 369000, discount: 0, images: ['quan-nu-Masara.webp', 'quan-nu-Masara1.webp', 'quan-nu-Masara2.webp', 'quan-nu-Masara3.webp'], colors: ['Đen', 'Be', 'Xám'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Quần Ống Rộng', slug: 'quan-ong-rong', description: 'Quần ống rộng thanh lịch. Vải mềm rơi đẹp không nhăn. Cạp cao tôn dáng, tạo vẻ cao ráo.', price: 379000, originalPrice: 499000, discount: 24, images: ['quan-ong-rong.webp', 'quan-ong-rong1.webp', 'quan-ong-rong2.webp', 'quan-ong-rong3.webp'], colors: ['Đen', 'Be', 'Xám'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Quần Short Nữ', slug: 'quan-short-nu', description: 'Short nữ trẻ trung năng động. Cotton thoáng mát. Form vừa phải, đùi không quá ngắn.', price: 229000, originalPrice: 229000, discount: 0, images: ['quan-short-nu.webp', 'quan-short-nu1.webp', 'quan-short-nu2.webp', 'quan-short-nu3.webp'], colors: ['Đen', 'Be', 'Xanh'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Quần Short Túi Hộp', slug: 'quan-short-tui-hop', description: 'Short túi hộp cargo style. Nhiều túi tiện dụng. Chất kaki dày dặn, form rộng.', price: 329000, originalPrice: 449000, discount: 27, images: ['quan-short-tui-hop.webp', 'quan-short-tui-hop1.webp', 'quan-short-tui-hop2.webp', 'quan-short-tui-hop3.webp'], colors: ['Đen', 'Be', 'Xanh rêu'], sizes: ['S', 'M', 'L', 'XL'], isFeatured: false },
            { name: 'Quần Short Unisex', slug: 'quan-short-unisex', description: 'Short unisex sporty. Cotton pha spandex thoáng mát. Túi hộp tiện lợi, dây rút cạp.', price: 249000, originalPrice: 249000, discount: 0, images: ['quan-short-unisex.webp', 'quan-short-unisex1.webp', 'quan-short-unisex2.webp', 'quan-short-unisex3.webp'], colors: ['Đen', 'Xám', 'Be'], sizes: ['S', 'M', 'L', 'XL'], isFeatured: false },
            { name: 'Quần Cargo Túi Hộp', slug: 'quan-tui-hop', description: 'Quần cargo túi hộp military. Nhiều túi lớn tiện dụng. Kaki dày dặn, form baggy oversized.', price: 499000, originalPrice: 749000, discount: 33, images: ['quan-tui-hop.webp', 'quan-tui-hop1.webp', 'quan-tui-hop2.webp', 'quan-tui-hop3.webp'], colors: ['Đen', 'Xanh rêu', 'Be'], sizes: ['M', 'L', 'XL'], isFeatured: true }
        ]
    },
    {
        name: 'Váy',
        slug: 'vay',
        description: 'Bộ sưu tập váy từ công sở đến dự tiệc, tôn vinh vẻ đẹp phái nữ',
        products: [
            { name: 'Chân Váy Ren', slug: 'chan-vay-ren', description: 'Chân váy ren cao cấp sang trọng. Ren mềm họa tiết tinh xảo. Cạp cao ôm eo, dáng chữ A.', price: 449000, originalPrice: 599000, discount: 25, images: ['chan-vay-ren.webp', 'chan-vay-ren1.webp', 'chan-vay-ren2.webp', 'chan-vay-ren3.webp'], colors: ['Đen', 'Trắng', 'Be'], sizes: ['S', 'M', 'L'], isFeatured: true },
            { name: 'Chân Váy Basic', slug: 'chan-vay', description: 'Chân váy basic dễ phối. Chất vải mềm mại thoải mái. Form chữ A che khuyết điểm tốt.', price: 329000, originalPrice: 329000, discount: 0, images: ['chan-vay.webp', 'chan-vay1.webp', 'chan-vay2.webp', 'chan-vay3.webp'], colors: ['Đen', 'Be', 'Xám'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Đầm Hai Dây Sang Trọng', slug: 'dam-hong-hai-day-sang-trong', description: 'Đầm hai dây dáng dài thanh lịch. Lụa mềm rơi đẹp. Cut-out eo sexy, form dài qua gối.', price: 549000, originalPrice: 549000, discount: 0, images: ['dam-hong-hai-day-dang-dai-sang-trong.jpg', 'dam-hong-hai-day-dang-dai-sang-trong1.jpg', 'dam-hong-hai-day-dang-dai-sang-trong2.jpg', 'dam-hong-hai-day-dang-dai-sang-trong3.jpg'], colors: ['Hồng', 'Đen', 'Trắng'], sizes: ['S', 'M', 'L'], isFeatured: true },
            { name: 'Váy Dự Tiệc', slug: 'vay-du-tiec', description: 'Váy dự tiệc sang trọng lộng lẫy. Vải cao cấp bóng nhẹ. Đính nơ vai, ôm body tôn dáng.', price: 799000, originalPrice: 1199000, discount: 33, images: ['vay-du-tiec.webp', 'vay-du-tiec1.webp', 'vay-du-tiec2.webp', 'vay-du-tiec3.webp'], colors: ['Đỏ', 'Đen', 'Xanh navy'], sizes: ['S', 'M', 'L'], isFeatured: true },
            { name: 'Váy Hoa Xòe', slug: 'vay-hoa', description: 'Váy hoa dáng xòe nữ tính. Họa tiết hoa tươi sáng. Vải mềm thoáng mát, dây chéo lưng.', price: 349000, originalPrice: 349000, discount: 0, images: ['vay-hoa.webp', 'vay-hoa1.webp', 'vay-hoa2.webp', 'vay-hoa3.webp'], colors: ['Hoa hồng', 'Hoa xanh', 'Hoa vàng'], sizes: ['S', 'M', 'L'], isFeatured: true },
            { name: 'Váy Tơ Ong Vintage', slug: 'vay-to-ong-co-v-no-nguc', description: 'Váy tơ ong vintage duyên dáng. Họa tiết caro nhỏ, nơ ngực điệu. Cotton mát, form A xòe nhẹ.', price: 289000, originalPrice: 399000, discount: 28, images: ['vay-to-ong-co-v-no-nguc.jpg', 'vay-to-ong-co-v-no-nguc1.jpg', 'vay-to-ong-co-v-no-nguc2.jpg', 'vay-to-ong-co-v-no-nguc3.jpg'], colors: ['Đen trắng', 'Nâu trắng'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Váy Trễ Vai', slug: 'vay-tre-vai', description: 'Váy trễ vai quyến rũ thanh lịch. Bẹt vai khoe vai trần. Vải mềm co giãn, dáng A xòe.', price: 399000, originalPrice: 399000, discount: 0, images: ['vay-tre-vai.jpg', 'vay-tre-vai1.jpg', 'vay-tre-vai3.jpg', 'z64vay-tre-vai3.jpg'], colors: ['Đen', 'Trắng', 'Hồng'], sizes: ['S', 'M', 'L'], isFeatured: false },
            { name: 'Váy Xếp Ly Hàn Quốc', slug: 'vay-xep-ly-xoe', description: 'Váy xếp ly Hàn Quốc trẻ trung. Vải nhún bền không nhăn. Form A xòe khi xoay, cạp cao.', price: 349000, originalPrice: 349000, discount: 0, images: ['vay-xep-ly-xoe.jpg', 'vay-xep-ly-xoe1.jpg', 'vay-xep-ly-xoe2.jpg', 'vay-xep-ly-xoe3.jpg'], colors: ['Đen', 'Xám', 'Be'], sizes: ['S', 'M', 'L'], isFeatured: false }
        ]
    },
    {
        name: 'Phụ kiện',
        slug: 'phu-kien',
        description: 'Phụ kiện thời trang hoàn thiện phong cách',
        products: [
            { name: 'Balo Da Cao Cấp', slug: 'balo-da', description: 'Balo da cao cấp sang trọng. Da PU chống nước. Nhiều ngăn, ngăn laptop riêng. Dây đeo êm.', price: 699000, originalPrice: 999000, discount: 30, images: ['balo-da.webp', 'balo-da1.webp', 'balo-da2.webp', 'balo-da3.webp'], colors: ['Đen', 'Nâu', 'Xám'], sizes: ['OneSize'], isFeatured: true },
            { name: 'Dây Chuyền Bạc S925', slug: 'day-chuyen-bac', description: 'Dây chuyền bạc S925 tinh xảo. Không dị ứng, bền màu. Đính đá zircon lấp lánh. Tặng hộp.', price: 349000, originalPrice: 349000, discount: 0, images: ['day-chuyen-bac.webp', 'day-chuyen-bac1.webp', 'day-chuyen-bac2.webp', 'day-chuyen-bac3.webp'], colors: ['Bạc'], sizes: ['OneSize'], isFeatured: true },
            { name: 'Khuyên Tai Bạc Nữ', slug: 'khuyem-tai-bac', description: 'Khuyên tai bạc nữ tinh tế. S925 không đen tai. Đá zircon lấp lánh. Khóa chắc chắn.', price: 199000, originalPrice: 299000, discount: 33, images: ['khuyem-tai-bac.webp', 'khuyem-tai-bac1.webp', 'khuyem-tai-bac2.webp', 'khuyem-tai-bac3.webp'], colors: ['Bạc', 'Bạc vàng'], sizes: ['OneSize'], isFeatured: false },
            { name: 'Mũ Len Mùa Đông', slug: 'mu-len', description: 'Mũ len unisex ấm áp mùa đông. Len dệt kim dày giữ nhiệt. Basic phù hợp nam nữ.', price: 149000, originalPrice: 149000, discount: 0, images: ['mu-len.webp', 'mu-len1.webp', 'mu-len2.webp', 'mu-len3.webp'], colors: ['Đen', 'Xám', 'Be'], sizes: ['OneSize'], isFeatured: false },
            { name: 'Mũ MLB Chính Hãng', slug: 'mu-mlb', description: 'Mũ MLB chính hãng 100%. Cotton cao cấp thoáng khí. Vành cứng giữ form, logo thêu nổi.', price: 549000, originalPrice: 750000, discount: 27, images: ['mu-mlb.webp', 'mu-mlb1.webp', 'mu-mlb2.webp', 'mu-mlb3.webp'], colors: ['Đen', 'Trắng', 'Xanh navy'], sizes: ['OneSize'], isFeatured: true },
            { name: 'Nhẫn Bạc Đính Đá', slug: 'nhan-bac', description: 'Nhẫn bạc nữ đính đá zircon. S925 cao cấp. Chỉnh size nhẹ. Không dị ứng, tặng hộp.', price: 249000, originalPrice: 249000, discount: 0, images: ['nhan-bac.webp', 'nhan-bac1.webp', 'nhan-bac2.webp', 'nhan-bac3.webp'], colors: ['Bạc'], sizes: ['OneSize'], isFeatured: false },
            { name: 'Túi Đeo Chéo Unisex', slug: 'tui-deo-cheo', description: 'Túi đeo chéo unisex streetwear. Canvas bền chắc chống nước. Nhiều ngăn nhỏ tiện lợi.', price: 219000, originalPrice: 349000, discount: 37, images: ['tui-deo-cheo.webp', 'tui-deo-cheo1.webp', 'tui-deo-cheo2.webp', 'tui-deo-cheo3.webp'], colors: ['Đen', 'Xám', 'Be'], sizes: ['OneSize'], isFeatured: false },
            { name: 'Túi Sách Nữ', slug: 'tui-sach', description: 'Túi sách nữ thời trang thanh lịch. Da PU mềm bền. Size vừa phải. Dây tháo rời, xách hoặc đeo.', price: 449000, originalPrice: 599000, discount: 25, images: ['tui-sach.webp', 'tui-sach1.webp', 'tui-sach2.webp', 'tui-sach3.webp'], colors: ['Đen', 'Be', 'Nâu'], sizes: ['OneSize'], isFeatured: false },
            { name: 'Túi Xách Mini', slug: 'tui-xach-mini', description: 'Túi xách mini thời trang, nhỏ gọn xinh xắn. Da PU cao cấp, kiểu dáng hiện đại. Phù hợp đi chơi, dự tiệc. Dây đeo có thể điều chỉnh.', price: 369000, originalPrice: 369000, discount: 0, images: ['tui-sach.webp', 'tui-sach1.webp', 'tui-sach2.webp', 'tui-sach3.webp'], colors: ['Đen', 'Be'], sizes: ['OneSize'], isFeatured: false },
            { name: 'Vòng Tay Bạc Charm', slug: 'vong-tay-bac', description: 'Vòng tay bạc charm trái tim. S925 không dị ứng. Điều chỉnh độ dài. Thiết kế tinh tế.', price: 279000, originalPrice: 399000, discount: 30, images: ['vong-tay-bac.webp', 'vong-tay-bac1.webp', 'vong-tay-bac2.webp', 'vong-tay-bac3.webp'], colors: ['Bạc', 'Bạc vàng'], sizes: ['OneSize'], isFeatured: false },
            { name: 'Vòng Tay Nữ Thời Trang', slug: 'vong-tay-nu', description: 'Vòng tay nữ phong cách hiện đại. Chất liệu bền đẹp. Dễ phối với nhiều trang phục. Làm quà ý nghĩa.', price: 259000, originalPrice: 339000, discount: 24, images: ['vong-tay-nu.webp', 'vong-tay-nu1.webp', 'vong-tay-nu2.webp', 'vong-tay-nu3.webp'], colors: ['Vàng', 'Bạc'], sizes: ['OneSize'], isFeatured: false }
        ]
    }
];

function generateVariants(colors, sizes, baseSku) {
    const variants = [];
    colors.forEach((color, colorIdx) => {
        sizes.forEach((size, sizeIdx) => {
            variants.push({
                color, size,
                sku: `${baseSku}-${String.fromCharCode(65 + colorIdx)}${sizeIdx + 1}`,
                stock: Math.floor(Math.random() * 31) + 20
            });
        });
    });
    return variants;
}

async function seedData() {
    try {
        console.log('🚀 Bắt đầu seed dữ liệu...\n');
        await connectDB();
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log('✅ Đã xóa dữ liệu cũ\n');

        let adminId;
        try {
            let admin = await User.findOne({ role: 'admin' });
            if (!admin) {
                admin = new User({ username: 'admin', email: 'admin@fashion.com', password: 'Admin123', firstName: 'Admin', lastName: 'Fashion', role: 'admin' });
                await admin.save();
                console.log('✅ Tạo admin mới');
            } else {
                console.log('✅ Dùng admin hiện có');
            }
            adminId = admin._id;
        } catch (err) {
            adminId = new mongoose.Types.ObjectId();
        }

        console.log('\n📂 Tạo danh mục và sản phẩm...\n');
        let totalProducts = 0;

        for (const categoryData of categoriesData) {
            const category = new Category({
                name: categoryData.name,
                slug: categoryData.slug,
                description: categoryData.description,
                createdBy: adminId,
                isActive: true
            });

            if (categoryData.products.length > 0) {
                const firstImage = categoryData.products[0].images[0];
                category.image = {
                    url: `http://10.0.2.2:4000/assets/images/${categoryData.slug}/${firstImage}`,
                    alt: categoryData.name
                };
            }

            await category.save();
            console.log(`📁 ${categoryData.name} (${category._id})`);

            for (let i = 0; i < categoryData.products.length; i++) {
                const productData = categoryData.products[i];
                const baseSku = `${categoryData.name[0]}${String(totalProducts + 1).padStart(3, '0')}`;
                const variants = generateVariants(productData.colors, productData.sizes, baseSku);
                const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
                const images = productData.images.map((imageName, index) => ({
                    url: `http://10.0.2.2:4000/assets/images/${categoryData.slug}/${imageName}`,
                    alt: `${productData.name} ${index + 1}`,
                    isMain: index === 0
                }));

                const product = new Product({
                    name: productData.name,
                    slug: productData.slug,
                    description: productData.description,
                    price: productData.price,
                    originalPrice: productData.originalPrice,
                    discount: productData.discount,
                    category: category._id,
                    sku: baseSku,
                    stock: { quantity: totalStock, lowStockThreshold: 10 },
                    images: images,
                    variants: variants,
                    colors: productData.colors,
                    sizes: productData.sizes,
                    tags: [categoryData.name, 'Thời trang', productData.isFeatured ? 'Hot' : 'Sale'],
                    rating: { average: (Math.random() * 2 + 3).toFixed(1), count: Math.floor(Math.random() * 150) + 20 },
                    isActive: true,
                    isFeatured: productData.isFeatured,
                    createdBy: adminId
                });

                await product.save();
                totalProducts++;
                console.log(`   ✓ ${productData.name} (${productData.colors.length} màu, ${productData.sizes.length} size)`);
            }
            console.log(`   ➜ Tổng: ${categoryData.products.length} sản phẩm\n`);
        }

        console.log('\n🎉 SEED HOÀN TẤT!');
        console.log(`📁 Danh mục: ${categoriesData.length}`);
        console.log(`📦 Sản phẩm: ${totalProducts}\n`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

seedData();

