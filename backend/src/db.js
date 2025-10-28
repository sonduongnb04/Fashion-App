// Cấu hình kết nối cơ sở dữ liệu MongoDB
const mongoose = require('mongoose');

async function connectDB() {
    // Lấy URI từ biến môi trường, mặc định kết nối local
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_app';
    // Bật strictQuery để hạn chế truy vấn không xác định
    mongoose.set('strictQuery', true);
    // Kết nối tới Mongo
    await mongoose.connect(uri);
    console.log('Đã kết nối MongoDB');
}

module.exports = { connectDB };


