const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/multer.middleware');
const {
    login,
    refreshAccessToken,
    logout,
    listAllUsers,
    getUserDetails,
    updateUserStatus,
    removeUser
} = require('../controllers/admin/auth.controller');

const {
    listInquiries,
    getInquiryDetails,
    updateInquiry,
    removeInquiry
} = require('../controllers/contact.controller');

const {
    getAdminPortfolioList,
    getAdminPortfolioDetails,
    createPortfolio,
    modifyPortfolio,
    removePortfolio
} = require('../controllers/portfolio.controller');

const {
    modifyFooter
} = require('../controllers/admin/footer.controller');

const {
    getAllWebsitesForAdmin,
    getWebsiteDetailsForAdmin,
    updateWebsiteVerificationStatus
} = require('../controllers/seller/website.controller');

const {
    createPackage,
    listManagedPackages,
    getManagedPackage,
    modifyPackage,
    removePackage,
    changePackageStatus,
    reviewPackageVerification
} = require('../controllers/admin/package.controller');

const {
    adminListWebsitesQuerySchema,
    websiteSlugParamSchema,
    adminReviewWebsiteSchema
} = require('../validations/website.validation');

const {
    updateFooterSchema
} = require('../validations/footer.validation');

const {
    createPackageSchema,
    updatePackageSchema,
    packageSlugParamSchema,
    togglePackageStatusSchema,
    reviewPackageSchema,
    listPackagesQuerySchema
} = require('../validations/package.validation');

const {
    getAllPressReleasesAdmin,
    getSinglePressReleaseAdmin,
    reviewPressReleaseStatus
} = require('../controllers/seller/pressRelease.controller');

const {
    reviewPressReleaseStatusSchema,
    prSlugParamSchema
} = require('../validations/pressRelease.validation');

// Middlewares
const validate = require('../middlewares/validate.middleware');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { USER_ROLES } = require('../constants/roles.constant');


// Validations
const {
    loginSchema,
    listUsersQuerySchema,
    userIdParamSchema,
    updateUserStatusSchema
} = require('../validations/auth.validation');
const {
    createPortfolioSchema,
    updatePortfolioSchema,
    portfolioIdentifierParamSchema
} = require('../validations/portfolio.validation');

// Cookie-based & Public Auth Routes (verifyJWT ke upar)
router.post('/auth/login', loginLimiter, validate(loginSchema), login);
router.post('/auth/refresh-token', refreshAccessToken);
router.post('/auth/logout', logout);

// Protected Admin Routes
router.use(verifyJWT, authorizeRoles(USER_ROLES.ADMIN));

router.get('/profile', (req, res) => {
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin profile fetched successfully',
        data: {
            user: req.user
        }
    });
});

// Platform user and seller management
router.get('/users', validate(listUsersQuerySchema), listAllUsers);
router.get('/users/:userId', validate(userIdParamSchema), getUserDetails);
router.patch('/users/:userId/status', validate(updateUserStatusSchema), updateUserStatus);
router.delete('/users/:userId', validate(userIdParamSchema), removeUser);

// Contact section
router.get('/contacts', listInquiries);
router.get('/contacts/:contactId', getInquiryDetails);
router.patch('/contacts/:contactId', updateInquiry);
router.delete('/contacts/:contactId', removeInquiry);

// Portfolio Management
router.get('/portfolio', getAdminPortfolioList);
router.get('/portfolio/:identifier', validate(portfolioIdentifierParamSchema), getAdminPortfolioDetails);
router.post('/portfolio', upload.single('thumbnail'), validate(createPortfolioSchema), createPortfolio);
router.patch('/portfolio/:identifier', upload.single('thumbnail'), validate(updatePortfolioSchema), modifyPortfolio);
router.delete('/portfolio/:identifier', validate(portfolioIdentifierParamSchema), removePortfolio);

// Admin Website Listing & Verification Section
router.get('/websites', validate(adminListWebsitesQuerySchema), getAllWebsitesForAdmin);
router.get('/websites/:slug', validate(websiteSlugParamSchema), getWebsiteDetailsForAdmin);
router.patch('/websites/:slug/review', validate(adminReviewWebsiteSchema), updateWebsiteVerificationStatus);

// Footer Management Section (Admin Only Update)
router.patch('/footer', validate(updateFooterSchema), modifyFooter);

// Admin Package Management & Verification Section
router.post('/packages', validate(createPackageSchema), createPackage);
router.get('/packages', validate(listPackagesQuerySchema), listManagedPackages);
router.get('/packages/:slug', validate(packageSlugParamSchema), getManagedPackage);
router.patch('/packages/:slug', validate(updatePackageSchema), modifyPackage);
router.patch('/packages/:slug/status', validate(togglePackageStatusSchema), changePackageStatus);
router.patch('/packages/:slug/review', validate(reviewPackageSchema), reviewPackageVerification);
router.delete('/packages/:slug', validate(packageSlugParamSchema), removePackage);

// Press Releases Section (Slug Based)
router.get('/press-releases', getAllPressReleasesAdmin);
router.get('/press-releases/:slug', validate(prSlugParamSchema), getSinglePressReleaseAdmin);
router.patch('/press-releases/:slug/status', validate(reviewPressReleaseStatusSchema), reviewPressReleaseStatus);

module.exports = router;    