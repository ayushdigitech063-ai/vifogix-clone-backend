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
        // NEW: UI me "Country: United States +4 Others" dikhane ke liye
        otherCountriesCount: {
            type: Number,
            default: 0,
            min: 0
        },
        language: {
            type: String,
            default: 'English',
            trim: true
        },

        // --- SEO Metrics (Missing hone par null store honge) ---
        mozDA: { type: Number, default: null, min: 0, max: 100 },
        ahrefsDR: { type: Number, default: null, min: 0, max: 100 },
        semrushAS: { type: Number, default: null, min: 0, max: 100 },

        // Existing field + NEW Semrush & Ahrefs split traffic for UI
        monthlyTraffic: { type: String, default: null },
        semrushTraffic: { type: String, default: null }, // e.g., "120.8M"
        ahrefsTraffic: { type: String, default: null },  // e.g., "75.9M"

        // NEW: Backlinks Column ("266.8M/55.9M Followed/No Followed")
        followedBacklinks: { type: String, default: null },   // e.g., "266.8M"
        noFollowedBacklinks: { type: String, default: null }, // e.g., "55.9M"

        // Domain Info ("Age: 32Y 2M" | "Added: 2Y 3M" createdAt se aayega)
        domainAge: { type: String, default: null },

        // NEW: "No. of Deal" Column ("250+")
        totalDeals: {
            type: Number,
            default: 0,
            min: 0
        },

        // --- Commercial Details ---
        price: {
            type: Number,
            required: true,
            min: [5, 'Price must be at least $5'],
            max: [20000, 'Price cannot exceed $20,000']
        },
        contentWritingPrice: {
            type: Number,
            default: 0,
            min: 0
        },
        turnaroundDays: {
            type: Number,
            default: 3,
            min: [1, 'Turnaround days must be at least 1'],
            max: [30, 'Turnaround days cannot exceed 30']
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

        // --- Verification Status (Admin dwara verify hoga) ---
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

// 1. Compound Index: Ek hi seller same domain ko 2 baar add na kar sake
websiteSchema.index({ sellerId: 1, domain: 1 }, { unique: true });

// 2. Marketplace Public Listing Index: Active websites filter & sort fast karne ke liye
websiteSchema.index({ status: 1, category: 1, price: 1 });

module.exports = mongoose.model('Website', websiteSchema);