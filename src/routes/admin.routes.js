const express = require('express');
const router = express.Router();

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
    adminListWebsitesQuerySchema,
    websiteIdParamSchema,
    adminReviewWebsiteSchema
} = require('../validations/website.validation');

const {
    updateFooterSchema
} = require('../validations/footer.validation');



// Middlewares
const validate = require('../middlewares/validate.middleware');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { USER_ROLES } = require('../constants/roles.constant');
const { upload } = require('../middlewares/multer.middleware');

// Validations
const {
    loginSchema,
    listUsersQuerySchema,
    userIdParamSchema,
    updateUserStatusSchema
} = require('../validations/auth.validation');
const { portfolioIdParamSchema } = require('../validations/portfolio.validation');
const {
} = require('../validations/contact.validation');

// Cookie-based & Public Auth Routes (verifyJWT ke upar)
router.post('/auth/login', loginLimiter, validate(loginSchema), login);
router.post('/auth/refresh-token', refreshAccessToken);
router.post('/auth/logout', logout);

// router.get('/footer', fetchFooter);

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
//platform user and seller management 

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
router.post('/portfolio', upload.single('thumbnail'), createPortfolio);
router.patch('/portfolio/:projectId', upload.single('thumbnail'), validate(portfolioIdParamSchema), modifyPortfolio);
router.delete('/portfolio/:projectId', validate(portfolioIdParamSchema), removePortfolio);

// Admin Website Listing & Verification Section
router.get('/websites', validate(adminListWebsitesQuerySchema), getAllWebsitesForAdmin);
router.get('/websites/:websiteId', validate(websiteIdParamSchema), getWebsiteDetailsForAdmin);
router.patch('/websites/:websiteId/review', validate(adminReviewWebsiteSchema), updateWebsiteVerificationStatus);

// Footer Management Section (Admin Only Update)
router.patch('/footer', validate(updateFooterSchema), modifyFooter);

module.exports = router;