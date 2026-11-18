const Wishlist = require('../models/wishlist.model');
const Website = require('../models/website.model');
const ApiError = require('../utils/ApiError');

// 1. Toggle Wishlist (Add if not present, Remove if already present)
const toggleBuyerWishlist = async (buyerId, websiteId) => {
    // Check if website exists and is ACTIVE
    const website = await Website.findOne({
        _id: websiteId,
        status: 'ACTIVE',
        isVerified: true
    })
        .select('_id domain')
        .lean();

    if (!website) {
        throw ApiError(404, 'Website not found or not available in marketplace');
    }

    const existingEntry = await Wishlist.findOne({ buyerId, websiteId });

    if (existingEntry) {
        await Wishlist.deleteOne({ _id: existingEntry._id });
        return {
            websiteId,
            isWishlisted: false,
            action: 'REMOVED'
        };
    }

    await Wishlist.create({ buyerId, websiteId });

    return {
        websiteId,
        isWishlisted: true,
        action: 'ADDED'
    };
};

// 2. Get Buyer's Full Wishlisted Websites (with Pagination)
const getBuyerWishlist = async (buyerId, { page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    const [wishlistItems, total] = await Promise.all([
        Wishlist.find({ buyerId })
            .populate({
                path: 'websiteId',
                match: { status: 'ACTIVE', isVerified: true },
                select: '-adminReviewNotes -__v'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Wishlist.countDocuments({ buyerId })
    ]);

    // Filter out any website that might have been suspended/deleted later
    const websites = wishlistItems
        .filter((item) => item.websiteId !== null)
        .map((item) => ({
            wishlistId: item._id,
            wishlistedAt: item.createdAt,
            ...item.websiteId
        }));

    return {
        websites,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// 3. Get Only Wishlisted Website IDs (For fast Heart icon highlighting on Marketplace table)
const getBuyerWishlistedIds = async (buyerId) => {
    const items = await Wishlist.find({ buyerId }).select('websiteId -_id').lean();
    return items.map((item) => String(item.websiteId));
};

// 4. Explicit Remove from Wishlist
const removeWebsiteFromWishlist = async (buyerId, websiteId) => {
    const deleted = await Wishlist.findOneAndDelete({ buyerId, websiteId });
    if (!deleted) {
        throw ApiError(404, 'Website not found in your wishlist');
    }
    return { websiteId, isWishlisted: false };
};

module.exports = {
    toggleBuyerWishlist,
    getBuyerWishlist,
    getBuyerWishlistedIds,
    removeWebsiteFromWishlist
};