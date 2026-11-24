require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { USER_ROLES } = require('../constants/roles.constant');

const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB for Admin seeding...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        const name = process.env.ADMIN_SEED_NAME || 'Super Admin';
        const email = (process.env.ADMIN_SEED_EMAIL || 'admin@marketplace.com')
            .toLowerCase()
            .trim();
        const password = process.env.ADMIN_SEED_PASSWORD || 'Admin@12345';

        // Check if ANY user with ADMIN role OR same email already exists
        const existingAdmin = await User.findOne({
            $or: [
                { role: USER_ROLES.ADMIN },
                { email }
            ]
        }).lean();

        if (existingAdmin) {
            console.log(
                `Admin already exists (Email: ${existingAdmin.email}, Role: ${existingAdmin.role}). Only one Admin is allowed.`
            );
            await mongoose.connection.close();
            process.exit(0);
        }

        // Hash password before saving to DB
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: USER_ROLES.ADMIN,
            status: 'ACTIVE'
        });

        console.log('--------------------------------------------------');
        console.log('Super Admin created successfully!');
        console.log(`ID: ${newAdmin._id}`);
        console.log(`Email: ${newAdmin.email}`);
        console.log(`Role: ${newAdmin.role}`);
        console.log('--------------------------------------------------');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        if (error.code === 11000) {
            console.log('Admin already exists. Duplicate role creation blocked by database index.');
        } else {
            console.error('Seeding failed with error:', error.message);
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

seedAdmin();