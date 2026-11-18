const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const {
    toggleBuyerWishlist,
    getBuyerWishlist,
    getBuyerWishlistedIds,
    removeWebsiteFromWishlist
} = require('../services/wishlist.service');

// 1. Toggle Website in Wishlist (Add / Remove)
const toggleWishlist = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const result = await toggleBuyerWishlist(req.user._id, req.body.websiteId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message:
            result.action === 'ADDED'
                ? 'Website added to wishlist successfully'
                : 'Website removed from wishlist successfully',
        data: result
    });
});

// 2. Get All Wishlisted Websites
const getMyWishlist = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const data = await getBuyerWishlist(req.user._id, req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Wishlist fetched successfully',
        data
    });
});

// 3. Get Wishlisted Website IDs Array
const getMyWishlistedIds = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const websiteIds = await getBuyerWishlistedIds(req.user._id);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Wishlisted website IDs fetched successfully',
        data: { websiteIds }
    });
});

// 4. Remove Specific Website from Wishlist
const removeFromWishlist = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const result = await removeWebsiteFromWishlist(req.user._id, req.params.websiteId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Website removed from wishlist successfully',
        data: result
    });
});

module.exports = {
    toggleWishlist,
    getMyWishlist,
    getMyWishlistedIds,
    removeFromWishlist
};