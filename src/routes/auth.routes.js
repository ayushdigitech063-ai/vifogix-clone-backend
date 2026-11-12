const express = require('express');
const router = express.Router();

const {
    register,
    login,
    refreshSellerAccessToken,
    refreshBuyerAccessToken,
    logoutSeller,
    logoutBuyer,
    getProfile
} = require('../controllers/admin/userAuth.controller');

const validate = require('../middlewares/validate.middleware');
const {
    registerUserSchema,
    loginUserSchema
} = require('../validations/userAuth.validation');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { verifyJWT } = require('../middlewares/auth.middleware');

// Public & Cookie-based Endpoints
router.post('/register', validate(registerUserSchema), register);
router.post('/login', loginLimiter, validate(loginUserSchema), login);

router.post('/seller/refresh-token', refreshSellerAccessToken);
router.post('/buyer/refresh-token', refreshBuyerAccessToken);

router.post('/seller/logout', logoutSeller);
router.post('/buyer/logout', logoutBuyer);

// Protected Endpoints
router.get('/profile', verifyJWT, getProfile);

module.exports = router;