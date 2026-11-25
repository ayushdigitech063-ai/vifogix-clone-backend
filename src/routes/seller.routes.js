const express = require('express');
const router = express.Router();

const {
    checkDomainStats,
    createSingleListing,
    uploadBulkCsvListings,
    getMyListings,
    getMainCategories,
    getSubCategoriesByCategory,
    updateMyListing,
    getMyWebsiteDetails
} = require('../controllers/seller/website.controller');

const {
    addPressRelease,
    getMyPressReleases,
    getSingleMyPressRelease,
    updateMyPressRelease,
    deleteMyPressRelease
} = require('../controllers/seller/pressRelease.controller');

const {
    createPressReleaseSchema,
    updatePressReleaseSchema,
    prSlugParamSchema
} = require('../validations/pressRelease.validation');

const { verifyJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { USER_ROLES } = require('../constants/roles.constant');
const { uploadCsv } = require('../middlewares/csvUpload.middleware');

const {
    addWebsiteSchema,
    checkDomainQuerySchema,
    listWebsitesQuerySchema,
    getSubCategoriesQuerySchema,
    updateWebsiteSchema,
    websiteSlugParamSchema
} = require('../validations/website.validation');

router.get('/categories', getMainCategories);
router.get('/subcategories', validate(getSubCategoriesQuerySchema), getSubCategoriesByCategory);

router.use(verifyJWT, authorizeRoles(USER_ROLES.SELLER));

router.get('/check-domain', validate(checkDomainQuerySchema), checkDomainStats);
router.post('/websites', validate(addWebsiteSchema), createSingleListing);
router.post('/websites/bulk-csv', uploadCsv.single('file'), uploadBulkCsvListings);
router.get('/websites', validate(listWebsitesQuerySchema), getMyListings);
router.patch('/websites/:slug', validate(updateWebsiteSchema), updateMyListing);
router.get('/websites/:slug', validate(websiteSlugParamSchema), getMyWebsiteDetails);

// Press Release Management (Seller Only - Slug Based)
router.post('/press-releases', validate(createPressReleaseSchema), addPressRelease);
router.get('/press-releases', getMyPressReleases);
router.get('/press-releases/:slug', validate(prSlugParamSchema), getSingleMyPressRelease);
router.patch('/press-releases/:slug', validate(updatePressReleaseSchema), updateMyPressRelease);
router.delete('/press-releases/:slug', validate(prSlugParamSchema), deleteMyPressRelease);

module.exports = router;