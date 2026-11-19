const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Package name is required'],
            trim: true,
            uppercase: true,
            unique: true
        },
        tagline: {
            type: String,
            required: [true, 'Tagline is required'],
            trim: true
        },
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
        features: {
            type: [String],
            required: [true, 'At least one feature is required'],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length >= 1,
                message: 'Please provide at least 1 feature'
            }
        },
        isPopular: {
            type: Boolean,
            default: false
        },
        badgeText: {
            type: String,
            default: null,
            trim: true
        },
        buttonText: {
            type: String,
            default: 'Get Started',
            trim: true
        },
        displayOrder: {
            type: Number,
            default: 1,
            min: [1, 'Display order must be at least 1'],
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);