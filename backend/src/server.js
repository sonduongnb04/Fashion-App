const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const productManageRoutes = require('./routes/productManageRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const { connectDB } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'fashion-app-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/manage/products', productManageRoutes);
app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 4000;
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Backend listening on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });


