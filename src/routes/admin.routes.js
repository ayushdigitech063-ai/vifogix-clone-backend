const express = require('express');
const router = express.Router();


const {
    login,
    refreshAccessToken,
    logout
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

// Middlewares
const validate = require('../middlewares/validate.middleware');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { USER_ROLES } = require('../constants/roles.constant');
const { upload } = require('../middlewares/multer.middleware');

// Validations
const { loginSchema } = require('../validations/auth.validation');
const { portfolioIdParamSchema } = require('../validations/portfolio.validation');
const {
    contactIdParamSchema,
    adminListInquiriesSchema,
    updateInquiryAdminSchema
} = require('../validations/contact.validation');


router.post('/auth/login', loginLimiter, validate(loginSchema), login);


router.post('/auth/refresh-token', refreshAccessToken);


router.use(verifyJWT, authorizeRoles(USER_ROLES.ADMIN));


router.post('/auth/logout', logout);

// 4. Admin Profile View
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

// contact section 
router.get('/contacts', validate(adminListInquiriesSchema), listInquiries);
router.get('/contacts/:contactId', validate(contactIdParamSchema), getInquiryDetails);
router.patch('/contacts/:contactId', validate(updateInquiryAdminSchema), updateInquiry);
router.delete('/contacts/:contactId', validate(contactIdParamSchema), removeInquiry);



// Portfolio Management
router.post('/portfolio', upload.single('thumbnail'), createPortfolio);
router.patch('/portfolio/:projectId', upload.single('thumbnail'), validate(portfolioIdParamSchema), modifyPortfolio);
router.delete('/portfolio/:projectId', validate(portfolioIdParamSchema), removePortfolio);

module.exports = router;