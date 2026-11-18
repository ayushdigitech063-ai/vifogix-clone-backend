const Cart = require('../models/cart.model');
const Website = require('../models/website.model');
const ApiError = require('../utils/ApiError');

// Helper: Format Cart with Live Website Price & Totals
const formatCartResponse = async (buyerId) => {
    const cart = await Cart.findOne({ buyerId })
        .populate({
            path: 'items.websiteId',
            select: 'domain category subCategories country price turnaroundDays linkType mozDA ahrefsDR semrushAS status isVerified sellerId'
        })
        .lean();

    if (!cart || cart.items.length === 0) {
        return {
            cartId: cart?._id || null,
            items: [],
            summary: {
                totalItems: 0,
                totalQuantity: 0,
                subtotal: 0,
                unavailableItemsCount: 0
            }
        };
    }

    let subtotal = 0;
    let totalQuantity = 0;
    let unavailableItemsCount = 0;

    const formattedItems = cart.items.map((item) => {
        const site = item.websiteId;
        const isAvailable = Boolean(site && site.status === 'ACTIVE' && site.isVerified);

        if (!isAvailable) {
            unavailableItemsCount += 1;
            return {
                itemId: item._id,
                isAvailable: false,
                unavailableReason: 'This website is no longer active in the marketplace',
                website: site || null,
                quantity: item.quantity,
                unitPrice: 0,
                itemTotal: 0
            };
        }

        const unitPrice = Number(site.price || 0);
        const itemTotal = Number((unitPrice * item.quantity).toFixed(2));

        subtotal = Number((subtotal + itemTotal).toFixed(2));
        totalQuantity += item.quantity;

        return {
            itemId: item._id,
            isAvailable: true,
            website: {
                _id: site._id,
                domain: site.domain,
                category: site.category,
                subCategories: site.subCategories,
                country: site.country,
                turnaroundDays: site.turnaroundDays,
                linkType: site.linkType,
                mozDA: site.mozDA,
                ahrefsDR: site.ahrefsDR,
                semrushAS: site.semrushAS,
                price: unitPrice
            },
            quantity: item.quantity,
            unitPrice,
            itemTotal
        };
    });

    return {
        cartId: cart._id,
        items: formattedItems,
        summary: {
            totalItems: formattedItems.length,
            totalQuantity,
            subtotal,
            unavailableItemsCount
        }
    };
};

// 1. Add Website to Cart
const addItemToCart = async (buyerId, { websiteId, quantity = 1 }) => {
    const website = await Website.findOne({
        _id: websiteId,
        status: 'ACTIVE',
        isVerified: true
    }).lean();

    if (!website) {
        throw ApiError(404, 'Website not found or not available in marketplace');
    }

    if (String(website.sellerId) === String(buyerId)) {
        throw ApiError(400, 'You cannot add your own listed website to the cart');
    }

    let cart = await Cart.findOne({ buyerId });
    if (!cart) {
        await Cart.create({
            buyerId,
            items: [{ websiteId, quantity }]
        });
        return formatCartResponse(buyerId);
    }

    const existingIndex = cart.items.findIndex(
        (item) => String(item.websiteId) === String(websiteId)
    );

    if (existingIndex > -1) {
        const newQty = cart.items[existingIndex].quantity + quantity;
        if (newQty > 10) {
            throw ApiError(400, 'Maximum 10 guest posts allowed per website in cart');
        }
        cart.items[existingIndex].quantity = newQty;
    } else {
        cart.items.push({ websiteId, quantity });
    }

    await cart.save();
    return formatCartResponse(buyerId);
};

// 2. Get Buyer Cart
const getBuyerCart = async (buyerId) => {
    return formatCartResponse(buyerId);
};

// 3. Update Quantity (+ / -)
const updateCartItem = async (buyerId, itemId, { quantity }) => {
    const cart = await Cart.findOne({ buyerId });
    if (!cart) throw ApiError(404, 'Cart not found');

    const item = cart.items.id(itemId);
    if (!item) throw ApiError(404, 'Cart item not found');

    item.quantity = quantity;
    await cart.save();
    return formatCartResponse(buyerId);
};

// 4. Remove Single Item
const removeCartItem = async (buyerId, itemId) => {
    const cart = await Cart.findOne({ buyerId });
    if (!cart) throw ApiError(404, 'Cart not found');

    const item = cart.items.id(itemId);
    if (!item) throw ApiError(404, 'Cart item not found');

    item.deleteOne();
    await cart.save();
    return formatCartResponse(buyerId);
};

// 5. Clear Entire Cart
const clearBuyerCart = async (buyerId) => {
    await Cart.findOneAndUpdate({ buyerId }, { $set: { items: [] } }, { new: true });
    return formatCartResponse(buyerId);
};

module.exports = {
    addItemToCart,
    getBuyerCart,
    updateCartItem,
    removeCartItem,
    clearBuyerCart
};