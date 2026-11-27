const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
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
            overall: { type: Number, default: 95, min: 0, max: 100 },
            performance: { type: Number, default: 95, min: 0, max: 100 },
            accessibility: { type: Number, default: 95, min: 0, max: 100 },
            bestPractices: { type: Number, default: 95, min: 0, max: 100 },
            seo: { type: Number, default: 95, min: 0, max: 100 }
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
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

portfolioSchema.virtual('displayDomain').get(function () {
    if (!this.domainUrl) return '';
    return this.domainUrl
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/+$/, '');
});

module.exports = mongoose.model('Portfolio', portfolioSchema);