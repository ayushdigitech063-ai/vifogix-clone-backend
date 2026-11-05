const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
    {
        inquiryType: {
            type: String,
            enum: ['BUYER', 'PUBLISHER'],
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        phone: {
            type: String,
            trim: true,
            default: null
        },
        companySize: {
            type: String,
            trim: true,
            default: null
        },
        goal: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['UNREAD', 'READ', 'IN_PROGRESS', 'RESOLVED'],
            default: 'UNREAD',
            index: true
        },
        adminNotes: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);