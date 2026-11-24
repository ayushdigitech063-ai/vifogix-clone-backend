require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { USER_ROLES } = require('../constants/roles.constant');

const seedPackageManager = async () => {
    try {
        console.log('Connecting to MongoDB for Package Manager seeding...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        const name = process.env.PACKAGE_MANAGER_SEED_NAME || 'Package Manager';
        const email = (process.env.PACKAGE_MANAGER_SEED_EMAIL || 'packagemanager@digitech.com')
            .toLowerCase()
            .trim();
        const password = process.env.PACKAGE_MANAGER_SEED_PASSWORD || 'Admin@12345';

        // Check if ANY user with PACKAGE_MANAGER role OR same email already exists
        const existingPackageManager = await User.findOne({
            $or: [
                { role: USER_ROLES.PACKAGE_MANAGER },
                { email }
            ]
        }).lean();

        if (existingPackageManager) {
            console.log(
                `Package Manager already exists (Email: ${existingPackageManager.email}, Role: ${existingPackageManager.role}). Only one Package Manager is allowed.`
            );
            await mongoose.connection.close();
            process.exit(0);
        }

        // Hash password before saving to DB (matching user.model.js pattern)
        const hashedPassword = await bcrypt.hash(password, 10);

        const newPackageManager = await User.create({
            name,
            email,
            password: hashedPassword,
            role: USER_ROLES.PACKAGE_MANAGER,
            status: 'ACTIVE'
        });

        console.log('--------------------------------------------------');
        console.log('Package Manager created successfully!');
        console.log(`ID: ${newPackageManager._id}`);
        console.log(`Email: ${newPackageManager.email}`);
        console.log(`Role: ${newPackageManager.role}`);
        console.log('--------------------------------------------------');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        if (error.code === 11000) {
            console.log('Package Manager already exists. Duplicate role creation blocked by database index.');
        } else {
            console.error('Seeding failed with error:', error.message);
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

seedPackageManager();