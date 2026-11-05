const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        domainUrl: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
       
        lighthouse: {
            overall: { type: Number, default: 95 },
            performance: { type: Number, default: 95 },
            accessibility: { type: Number, default: 95 },
            bestPractices: { type: Number, default: 95 },
            seo: { type: Number, default: 95 }
        },
        
        technologies: [
            { type: String, trim: true }
        ],
        isVerified: {
            type: Boolean,
            default: true
        },
        coreWebVitalsPassed: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);