const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        domain: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        category: {
            type: String,
            default: 'All',
            trim: true,
            index: true
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true
        },
        language: {
            type: String,
            default: 'English'
        },

        // Metrics (Missing hone par null store honge)
        mozDA: { type: Number, default: null },
        ahrefsDR: { type: Number, default: null },
        semrushAS: { type: Number, default: null },
        monthlyTraffic: { type: String, default: null },
        domainAge: { type: String, default: null },

        // Commercial Details
        price: {
            type: Number,
            required: true,
            min: [0.01, 'Price must be greater than 0']
        },
        contentWritingPrice: {
            type: Number,
            default: 0,
            min: 0
        },
        turnaroundDays: {
            type: Number,
            default: 3,
            min: 1
        },
        maxLinksAllowed: {
            type: Number,
            default: 2,
            min: 1,
            max: 5
        },
        linkType: {
            type: String,
            enum: ['DoFollow', 'NoFollow'],
            default: 'DoFollow'
        },
        samplePostUrl: {
            type: String,
            default: null,
            trim: true
        },

        // Verification Status (Admin dwara verify hoga)
        isVerified: {
            type: Boolean,
            default: false,
            index: true
        },
        status: {
            type: String,
            enum: ['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
            default: 'PENDING_VERIFICATION',
            index: true
        },
        adminReviewNotes: {
            type: String,
            default: null
        },
        verifiedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Compound Index: Ek hi seller same domain ko 2 baar add na kar sake
websiteSchema.index({ sellerId: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model('Website', websiteSchema);