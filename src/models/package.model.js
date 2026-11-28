// const mongoose = require('mongoose');

// const packageSchema = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             required: [true, 'Package name is required'],
//             trim: true,
//             uppercase: true,
//             unique: true
//         },
//         tagline: {
//             type: String,
//             required: [true, 'Tagline is required'],
//             trim: true
//         },
//         price: {
//             type: Number,
//             default: null,
//             min: [0, 'Price cannot be negative']
//         },
//         isCustomPrice: {
//             type: Boolean,
//             default: false
//         },
//         customPriceLabel: {
//             type: String,
//             default: 'Custom',
//             trim: true
//         },
//         billingCycle: {
//             type: String,
//             default: '/mo',
//             trim: true
//         },
//         features: {
//             type: [String],
//             required: [true, 'At least one feature is required'],
//             validate: {
//                 validator: (arr) => Array.isArray(arr) && arr.length >= 1,
//                 message: 'Please provide at least 1 feature'
//             }
//         },
//         isPopular: {
//             type: Boolean,
//             default: false
//         },
//         badgeText: {
//             type: String,
//             default: null,
//             trim: true
//         },
//         // buttonText: {
//         //     type: String,
//         //     default: 'Get Started',
//         //     trim: true
//         // },
//         displayOrder: {
//             type: Number,
//             default: 1,
//             min: [1, 'Display order must be at least 1'],
//             index: true
//         },
//         isActive: {
//             type: Boolean,
//             default: true,
//             index: true
//         }
//     },
//     { timestamps: true }
// );

// module.exports = mongoose.model('Package', packageSchema);

const mongoose = require('mongoose');

const packageActivitySchema = new mongoose.Schema({
    activityName: {
        type: String,
        required: [true, 'SEO activity name is required'],
        trim: true
    },
    monthlyCount: {
        type: Number,
        required: [true, 'Base monthly quantity is required'],
        min: [1, 'Monthly quantity must be at least 1']
    },
    // Hidden unit price for each extra (+1) quantity added by buyer
    unitAddonPrice: {
        type: Number,
        required: [true, 'Unit add-on price is required'],
        min: [0, 'Unit add-on price cannot be negative'],
        default: 0
    },
    isAddonAllowed: {
        type: Boolean,
        default: true
    }
});

const packageSchema = new mongoose.Schema(
    {
        // Multi-Role Ownership Tracking
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        creatorRole: {
            type: String,
            enum: ['ADMIN', 'PACKAGE_MANAGER'],
            required: true,
            index: true
        },

        // Core Package Identity
        name: {
            type: String,
            required: [true, 'Package name is required'],
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        tagline: {
            type: String,
            required: [true, 'Tagline is required'],
            trim: true
        },

        // Manual Package Overview & Key Bullet Points (Optional)
        overview: {
            type: String,
            trim: true,
            default: null
        },
        highlights: {
            type: [String],
            default: []
        },

        // Pricing & Billing
        price: {
            type: Number,
            default: null,
            min: [0, 'Price cannot be negative']
        },
        isCustomPrice: {
            type: Boolean,
            default: false
        },
        customPriceLabel: {
            type: String,
            default: 'Custom',
            trim: true
        },
        billingCycle: {
            type: String,
            default: '/mo',
            trim: true
        },

        // Manual Monthly SEO Activities & Hidden Add-On Pricing
        activities: {
            type: [packageActivitySchema],
            required: [true, 'At least one SEO activity is required'],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length >= 1,
                message: 'Please provide at least 1 SEO activity'
            }
        },

        // Auto-Calculated Grand Total of Base Monthly Links
        totalLinks: {
            type: Number,
            default: 0,
            min: 0
        },

        // UI Display & Badges
        isPopular: {
            type: Boolean,
            default: false
        },
        badgeText: {
            type: String,
            default: null,
            trim: true
        },
        displayOrder: {
            type: Number,
            default: 1,
            min: [1, 'Display order must be at least 1'],
            index: true
        },

        // Verification & Lifecycle Status
        status: {
            type: String,
            enum: ['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
            default: 'PENDING_VERIFICATION',
            index: true
        },
        isVerified: {
            type: Boolean,
            default: false,
            index: true
        },
        verifiedAt: {
            type: Date,
            default: null
        },
        adminReviewNotes: {
            type: String,
            trim: true,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    { timestamps: true }
);

// Automatically calculate totalLinks from activities before saving
packageSchema.pre('save', function () {
    if (Array.isArray(this.activities)) {
        this.totalLinks = this.activities.reduce(
            (sum, item) => sum + (Number(item.monthlyCount) || 0),
            0
        );
    }
    if (!this.isCustomPrice) {
        this.customPriceLabel = null;
    }
});

// Compound indexes for fast public & creator dashboard queries
packageSchema.index({ status: 1, isVerified: 1, isActive: 1, isDeleted: 1, displayOrder: 1 });
packageSchema.index({ createdBy: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Package', packageSchema);