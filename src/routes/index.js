const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin.routes');


router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Marketplace API is healthy and operational'
    });
});

router.use('/admin', adminRoutes);


module.exports = router;