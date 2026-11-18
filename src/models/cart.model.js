const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
    {
        websiteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Website',
            required: true
        },
        quantity: {
            type: Number,
            default: 1,
            min: [1, 'Quantity must be at least 1'],
            max: [10, 'Maximum 10 posts allowed per website']
        }
    },
    { _id: true }
);

const cartSchema = new mongoose.Schema(
    {
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        items: {
            type: [cartItemSchema],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);