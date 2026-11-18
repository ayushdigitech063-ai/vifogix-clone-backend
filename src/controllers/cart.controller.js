const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const {
    addItemToCart,
    getBuyerCart,
    updateCartItem,
    removeCartItem,
    clearBuyerCart
} = require('../services/cart.service');


const addToCart = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const cart = await addItemToCart(req.user._id, req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Website added to cart successfully',
        data: cart
    });
});


const getMyCart = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const cart = await getBuyerCart(req.user._id);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Cart fetched successfully',
        data: cart
    });
});


const updateMyCartItem = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const cart = await updateCartItem(req.user._id, req.params.itemId, req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Cart item updated successfully',
        data: cart
    });
});


const deleteMyCartItem = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const cart = await removeCartItem(req.user._id, req.params.itemId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Item removed from cart successfully',
        data: cart
    });
});


const emptyMyCart = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized buyer access');
    }

    const cart = await clearBuyerCart(req.user._id);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Cart cleared successfully',
        data: cart
    });
});

module.exports = {
    addToCart,
    getMyCart,
    updateMyCartItem,
    deleteMyCartItem,
    emptyMyCart
};