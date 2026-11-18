const express = require('express');
const router = express.Router();

// Controllers
const { fetchFooter } = require('../controllers/admin/footer.controller');
// const { getPublicMarketplaceWebsites } = require('../controllers/seller/website.controller');
// const { listPublicPortfolios } = require('../controllers/portfolio.controller');
// const { submitContactInquiry } = require('../controllers/contact.controller');


// 1. Footer Data
// GET /api/v1/public/footer
router.get('/footer', fetchFooter);

// 2. Public Website Marketplace
// GET /api/v1/public/marketplace
// router.get('/marketplace', getPublicMarketplaceWebsites);

// 3. Public Portfolio Projects
// GET /api/v1/public/portfolio
// router.get('/portfolio', listPublicPortfolios);

// 4. Public Contact Us Form Submission
// POST /api/v1/public/contact
// router.post('/contact', submitContactInquiry);

module.exports = router;