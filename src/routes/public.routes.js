const express = require('express');
const router = express.Router();

// Controllers
const { fetchFooter } = require('../controllers/admin/footer.controller');
const { getMarketplaceListings, getPublicWebsiteDetails } = require('../controllers/seller/website.controller');
const { listPublicPackages } = require('../controllers/admin/package.controller');
// const { listPublicPortfolios } = require('../controllers/portfolio.controller');
// const { submitContactInquiry } = require('../controllers/contact.controller');

const {
    getPublicPressReleases,
    getPublicPressReleaseById
} = require('../controllers/seller/pressRelease.controller');

const { prIdParamSchema } = require('../validations/pressRelease.validation');

const validate = require('../middlewares/validate.middleware');
const {
    listWebsitesQuerySchema,
    websiteSlugParamSchema
} = require('../validations/website.validation');

// 1. Footer Data
// GET /api/v1/public/footer
router.get('/footer', fetchFooter);

// 2. Public Website Marketplace
// GET /api/v1/public/marketplace
router.get('/marketplace', validate(listWebsitesQuerySchema), getMarketplaceListings);
router.get('/marketplace/:slug', validate(websiteSlugParamSchema), getPublicWebsiteDetails);

// 3. Public Portfolio Projects
// GET /api/v1/public/portfolio
// router.get('/portfolio', listPublicPortfolios);

// 4. Public Contact Us Form Submission
// POST /api/v1/public/contact
// router.post('/contact', submitContactInquiry);

// package listing
router.get('/packages', listPublicPackages);

router.get('/press-releases', getPublicPressReleases);
router.get('/press-releases/:prId', validate(prIdParamSchema), getPublicPressReleaseById);

module.exports = router;