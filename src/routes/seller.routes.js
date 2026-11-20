const express = require('express');
const router = express.Router();

const {
    checkDomainStats,
    createSingleListing,
    uploadBulkCsvListings,
    getMyListings,
    // getMarketplaceListings,
    getMainCategories,
    getSubCategoriesByCategory
} = require('../controllers/seller/website.controller');

const {
    addPressRelease,
    getMyPressReleases,
    getMyPressReleaseById,
    updateMyPressRelease,
    deleteMyPressRelease
} = require('../controllers/seller/pressRelease.controller');


const {
    createPressReleaseSchema,
    updatePressReleaseSchema,
    prIdParamSchema
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
    getSubCategoriesQuerySchema
} = require('../validations/website.validation');

// router.get('/marketplace', validate(listWebsitesQuerySchema), getMarketplaceListings);
router.get('/categories', getMainCategories);
router.get('/subcategories', validate(getSubCategoriesQuerySchema), getSubCategoriesByCategory);

router.use(verifyJWT, authorizeRoles(USER_ROLES.SELLER));

router.get('/check-domain', validate(checkDomainQuerySchema), checkDomainStats);
router.post('/websites', validate(addWebsiteSchema), createSingleListing);
router.post('/websites/bulk-csv', uploadCsv.single('file'), uploadBulkCsvListings);
router.get('/websites', validate(listWebsitesQuerySchema), getMyListings);


// Press Release Management (Seller Only)
router.post('/press-releases', validate(createPressReleaseSchema), addPressRelease);
router.get('/press-releases', getMyPressReleases);
router.get('/press-releases/:prId', validate(prIdParamSchema), getMyPressReleaseById);
router.patch('/press-releases/:prId', validate(updatePressReleaseSchema), updateMyPressRelease);
router.delete('/press-releases/:prId', validate(prIdParamSchema), deleteMyPressRelease);



module.exports = router;