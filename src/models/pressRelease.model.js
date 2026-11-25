const mongoose = require('mongoose');
const { VALID_CATEGORY_NAMES } = require('../constants/category.constant');

const buildBaseSlug = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const pressReleaseSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        
        title: {
            type: String,
            required: [true, 'Press release title or outlet name is required'],
            trim: true,
            maxlength: [150, 'Title cannot exceed 150 characters']
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true
        },
        packageDescription: {
            type: String,
            required: [true, 'Package description is required'],
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },
        image: {
            type: String, // Cloudinary / Image URL
            default: null,
            trim: true
        },
        outletDomain: {
            type: String,
            lowercase: true,
            trim: true,
            default: null,
            index: true
        },
        outletsCount: {
            type: Number,
            default: 1,
            min: [1, 'Outlets count must be at least 1']
        },

        // --- 2. Included & Excluded Lists (Optional) ---
        included: {
            type: [String],
            default: []
        },
        excluded: {
            type: [String],
            default: []
        },

        // --- 3. Niche & Geography ---
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: {
                values: VALID_CATEGORY_NAMES,
                message: '{VALUE} is not a valid category'
            },
            trim: true,
            index: true
        },
        subCategories: {
            type: [String],
            required: [true, 'At least one subcategory is required'],
            validate: {
                validator: function (arr) {
                    return Array.isArray(arr) && arr.length >= 1;
                },
                message: 'Please select at least 1 subcategory'
            },
            index: true
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true,
            index: true
        },
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

        // --- 4. SEO & Reach Metrics ---
        mozDA: { type: Number, default: null, min: 0, max: 100 },
        ahrefsDR: { type: Number, default: null, min: 0, max: 100 },
        semrushAS: { type: Number, default: null, min: 0, max: 100 },
        monthlyTraffic: { type: String, default: null, trim: true },
        estimatedReach: { type: String, default: null, trim: true },

        // --- 5. Publishing Specs & Links ---
        maxWordsAllowed: {
            type: Number,
            default: 500,
            min: [100, 'Minimum word limit must be at least 100'],
            max: [5000, 'Word limit cannot exceed 5000']
        },
        extraWordPricePer100: {
            type: Number,
            default: 0,
            min: 0
        },
        maxLinksAllowed: {
            type: Number,
            default: 3,
            min: 1,
            max: 10
        },
        linkType: {
            type: String,
            enum: ['DoFollow', 'NoFollow', 'Sponsored'],
            default: 'NoFollow'
        },
        maxImagesAllowed: {
            type: Number,
            default: 2,
            min: 0,
            max: 10
        },
        hasSponsoredTag: {
            type: Boolean,
            default: true
        },

        // --- 6. Commercial Pricing & PR Writing Option ---
        price: {
            type: Number,
            required: [true, 'Publishing price is required'],
            min: [5, 'Price must be at least $5'],
            max: [50000, 'Price cannot exceed $50,000']
        },
        isPrWritingAvailable: {
            type: Boolean,
            default: false
        },
        prWritingPrice: {
            type: Number,
            default: 0,
            min: 0
        },
        turnaroundDays: {
            type: Number,
            default: 2,
            min: [1, 'Turnaround days must be at least 1'],
            max: [30, 'Turnaround days cannot exceed 30']
        },
        totalDeals: {
            type: Number,
            default: 0,
            min: 0
        },

        // --- 7. Admin Verification & Marketplace Status ---
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
        },

        // --- 8. Soft Delete Fields ---
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Auto-generate unique SEO-friendly slug from title
pressReleaseSchema.pre('save', async function () {
    if (!this.isModified('title') && this.slug) return;

    const baseSlug = buildBaseSlug(this.title) || `press-release-${Date.now()}`;
    let candidateSlug = baseSlug;
    let counter = 2;

    const Model = this.constructor;
    while (await Model.exists({ slug: candidateSlug, _id: { $ne: this._id } })) {
        candidateSlug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    this.slug = candidateSlug;
});

pressReleaseSchema.index(
    { sellerId: 1, outletDomain: 1 },
    {
        unique: true,
        partialFilterExpression: {
            outletDomain: { $type: 'string', $gt: '' },
            isDeleted: false
        }
    }
);

pressReleaseSchema.index({ status: 1, isDeleted: 1, category: 1, price: 1 });

pressReleaseSchema.virtual('totalPriceWithWriting').get(function () {
    if (!this.isPrWritingAvailable) return this.price;
    return this.price + (this.prWritingPrice || 0);
});

pressReleaseSchema.set('toJSON', { virtuals: true });
pressReleaseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PressRelease', pressReleaseSchema);