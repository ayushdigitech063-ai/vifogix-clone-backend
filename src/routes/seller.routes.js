const express = require('express');
const router = express.Router();

// Seller Controller Handlers
const {
    checkDomainStats,
    createSingleListing,
    uploadBulkCsvListings,
    getMyListings
} = require('../controllers/seller/website.controller');

// Middlewares
const { verifyJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { USER_ROLES } = require('../constants/roles.constant');
const { uploadCsv } = require('../middlewares/csvUpload.middleware');

// Validations
const {
    addWebsiteSchema,
    listWebsitesQuerySchema
} = require('../validations/website.validation');

// All routes are strictly protected for Logged-In Sellers
router.use(verifyJWT, authorizeRoles(USER_ROLES.SELLER));

// 1. Live Domain Pre-Check (Frontend input check to see previous sellers count)
// GET /api/v1/seller/check-domain?domain=forbes.com
router.get('/check-domain', checkDomainStats);

// 2. Single Website Add Form (Mandatory Country & Valid URL)
// POST /api/v1/seller/websites
router.post('/websites', validate(addWebsiteSchema), createSingleListing);

// 3. Bulk CSV 1000+ Upload
// POST /api/v1/seller/websites/bulk-csv
router.post('/websites/bulk-csv', uploadCsv.single('file'), uploadBulkCsvListings);

// 4. Get Seller Websites List with Pagination, Search & Country filter
// GET /api/v1/seller/websites?page=1&limit=10&status=PENDING_VERIFICATION&country=USA&search=tech
router.get('/websites', validate(listWebsitesQuerySchema), getMyListings);

module.exports = router;