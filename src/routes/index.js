const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin.routes');
const authRoutes = require('./auth.routes');
const contactRoutes = require('./contact.routes');
const portfolioRoutes = require('./portfolio.routes');
const sellerRoutes = require('./seller.routes');
const buyerWishlistRoutes = require('./buyerWishlist.routes');
const buyerCartRoutes = require('./buyerCart.routes');
const publicRoutes = require("./public.routes")
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Marketplace API is healthy and operational'
    });
});

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/seller', sellerRoutes);
router.use('/wishlist', buyerWishlistRoutes);
router.use('/cart', buyerCartRoutes);
router.use('/public' , publicRoutes)
module.exports = router;