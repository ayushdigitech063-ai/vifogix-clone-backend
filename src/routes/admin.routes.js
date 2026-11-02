const express = require('express');
const router = express.Router();

// Controllers ko seedhe destructure kiya
const {
    login,
    refreshAccessToken,
    logout
} = require('../controllers/admin/auth.controller');

// Middlewares
const validate = require('../middlewares/validate.middleware');
const { loginSchema } = require('../validations/auth.validation');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { USER_ROLES } = require('../constants/roles.constant');

// 1. Admin Login (Rate-limiting + Zod Validation)
router.post('/auth/login', loginLimiter, validate(loginSchema), login);

// 2. Refresh Access Token
router.post('/auth/refresh-token', refreshAccessToken);

// 3. Admin Logout (Protected)
router.post('/auth/logout', verifyJWT, logout);

// 4. Admin Profile View (Protected - Only ADMIN)
router.get(
    '/profile',
    verifyJWT,
    authorizeRoles(USER_ROLES.ADMIN),
    (req, res) => {
        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Admin profile fetched successfully',
            data: {
                user: req.user
            }
        });
    }
);

module.exports = router;