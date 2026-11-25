const express = require('express');
const router = express.Router();

// Controllers
const { fetchFooter } = require('../controllers/admin/footer.controller');
const { getMarketplaceListings, getPublicWebsiteDetails } = require('../controllers/seller/website.controller');
const {
    listPublicPackages,
    getPublicPackageDetails,
    getCalculatedPackagePrice
} = require('../controllers/admin/package.controller');

const {
    getPublicPressReleases,
    getSinglePublicPressRelease
} = require('../controllers/seller/pressRelease.controller');

// Middlewares & Validations
const validate = require('../middlewares/validate.middleware');
const { prSlugParamSchema } = require('../validations/pressRelease.validation');
const {
    listWebsitesQuerySchema,
    websiteSlugParamSchema
} = require('../validations/website.validation');
const {
    packageSlugParamSchema,
    calculatePackagePriceSchema
} = require('../validations/package.validation');

// 1. Footer Data
router.get('/footer', fetchFooter);

// 2. Public Website Marketplace
router.get('/marketplace', validate(listWebsitesQuerySchema), getMarketplaceListings);
router.get('/marketplace/:slug', validate(websiteSlugParamSchema), getPublicWebsiteDetails);

// 3. Public SEO Packages & Live Add-On Price Calculator
router.get('/packages', listPublicPackages);
router.get('/packages/:slug', validate(packageSlugParamSchema), getPublicPackageDetails);
router.post('/packages/:slug/calculate-price', validate(calculatePackagePriceSchema), getCalculatedPackagePrice);

// 4. Public Press Releases (Slug Based)
router.get('/press-releases', getPublicPressReleases);
router.get('/press-releases/:slug', validate(prSlugParamSchema), getSinglePublicPressRelease);

module.exports = router;