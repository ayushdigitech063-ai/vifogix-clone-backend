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