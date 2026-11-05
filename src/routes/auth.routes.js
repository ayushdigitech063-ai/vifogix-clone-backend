const express = require('express');
const router = express.Router();

const {
    register,
    login,
    logout,
    getProfile
} = require('../controllers/admin/userAuth.controller');

const validate = require('../middlewares/validate.middleware');
const {
    registerUserSchema,
    loginUserSchema
} = require('../validations/userAuth.validation');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { verifyJWT } = require('../middlewares/auth.middleware');

// Public endpoints
router.post('/register', validate(registerUserSchema), register);
router.post('/login', loginLimiter, validate(loginUserSchema), login);

// Protected endpoints
router.post('/logout', verifyJWT, logout);
router.get('/profile', verifyJWT, getProfile);

module.exports = router;