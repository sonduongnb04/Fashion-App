const fs = require('fs');
const path = require('path');
// Nạp biến môi trường từ file .env trong thư mục src
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

// Định nghĩa các router chính của ứng dụng
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const productManageRoutes = require('./routes/productManageRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const revenueRoutes = require('./routes/revenueRoutes');

const { connectDB } = require('./db');
const User = require('./models/User');

// Khởi tạo ứng dụng Express
const app = express();

// Bật CORS và JSON parser cho body
app.use(cors());
app.use(express.json());

// Serve static files từ thư mục assets
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Endpoint kiểm tra tình trạng dịch vụ
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'fashion-app-backend' });
});

// Gắn router vào các đường dẫn API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/manage/products', productManageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/revenue', revenueRoutes);

// Cổng chạy dịch vụ
const PORT = process.env.PORT || 4000;
connectDB()
    .then(async () => {
        // Đảm bảo có admin mặc định trong cùng DB mà server đang dùng
        try {
            let admin = await User.findOne({ email: new RegExp('^admin@fashion.com$', 'i') });
            if (!admin) {
                admin = new User({
                    username: 'admin',
                    email: 'admin@fashion.com',
                    password: 'Admin123',
                    firstName: 'Admin',
                    lastName: 'Fashion',
                    role: 'admin',
                    isActive: true,
                });
                await admin.save();
                console.log('✅ Created default admin: admin@fashion.com / Admin123');
            } else {
                // Bảo toàn quyền admin và trạng thái hoạt động
                let changed = false;
                if (admin.role !== 'admin') { admin.role = 'admin'; changed = true; }
                if (admin.isActive === false) { admin.isActive = true; changed = true; }
                if (changed) { await admin.save(); console.log('✅ Ensured admin role/active for existing admin'); }
            }
        } catch (e) {
            console.error('⚠️ Ensure default admin failed:', e);
        }

        // Chỉ khởi động server sau khi kết nối DB thành công
        app.listen(PORT, () => {
            console.log(`Backend listening on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Kết nối MongoDB thất bại', err);
        process.exit(1);
    });


