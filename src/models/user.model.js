const mongoose = require('mongoose');
const { USER_ROLES } = require('../constants/roles.constant');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        password: {
            type: String,
            required: true
        },  
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.BUYER
        },
        // 👇 YEH FIELD ADD HOGI (Only for Seller Identity Verification)
       socialProfiles: {
            type: {
                linkedin: { type: String, trim: true, default: null },
                facebook: { type: String, trim: true, default: null },
                instagram: { type: String, trim: true, default: null }
            },
            required: false
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'SUSPENDED'],
            default: 'ACTIVE'
        },
        refreshToken: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);