require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../src/db');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

async function run() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@fashion.local';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        await connectDB();

        // Admin user
        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            const passwordHash = await bcrypt.hash(adminPassword, 10);
            admin = await User.create({ email: adminEmail, passwordHash, name: 'Admin', role: 'admin' });
            console.log('Created admin:', admin.email);
        } else {
            console.log('Admin already exists:', admin.email);
        }

        // Sample products
        const count = await Product.estimatedDocumentCount();
        if (count === 0) {
            await Product.insertMany([
                { name: 'Basic Tee', price: 19.99, stock: 50, description: 'Cotton tee', images: [] },
                { name: 'Denim Jacket', price: 59.99, stock: 12, description: 'Blue denim jacket', images: [] },
                { name: 'Sneakers', price: 79.0, stock: 25, description: 'Comfortable sneakers', images: [] },
            ]);
            console.log('Inserted sample products');
        } else {
            console.log('Products already present:', count);
        }

        await mongoose.connection.close();
        console.log('Seed completed');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed', err);
        process.exit(1);
    }
}

run();


