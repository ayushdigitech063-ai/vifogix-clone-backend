require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { USER_ROLES } = require('../constants/roles.constant');

const seedAdmin = async () => {
    try {
        console.log('🔄 Connecting to MongoDB for seeding...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB successfully.');

        const name = process.env.ADMIN_SEED_NAME || 'Super Admin';
        const email = (process.env.ADMIN_SEED_EMAIL || 'admin@marketplace.com').toLowerCase().trim();
        const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@12345';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log(`ℹ️ Admin already exists with email: ${email}`);
            await mongoose.connection.close();
            process.exit(0);
        }

        // Hash password before saving to DB
        const hashedPassword = await bcrypt.hash(password, 10);

        // Model field name is 'password'
        const newAdmin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: USER_ROLES.ADMIN,
            status: 'ACTIVE'
        });

        console.log('--------------------------------------------------');
        console.log('🎉 Super Admin created successfully!');
        console.log(`🆔 ID: ${newAdmin._id}`);
        console.log(`📧 Email: ${newAdmin.email}`);
        console.log(`🔑 Role: ${newAdmin.role}`);
        console.log('--------------------------------------------------');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed with error:', error.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

seedAdmin();