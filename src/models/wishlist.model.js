const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
    {
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        websiteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Website',
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate wishlist entry for the same buyer + website
wishlistSchema.index({ buyerId: 1, websiteId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);