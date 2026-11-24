const express = require('express');
const router = express.Router();

// Middlewares
const { verifyJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/rbac.middleware');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');
const validate = require('../middlewares/validate.middleware');
const { USER_ROLES } = require('../constants/roles.constant');

// Validations
const { loginSchema } = require('../validations/auth.validation');
const {
    createPackageSchema,
    updatePackageSchema,
    packageSlugParamSchema,
    togglePackageStatusSchema,
    listPackagesQuerySchema
} = require('../validations/package.validation');

// Auth Controllers (Package Manager Login, Refresh Token, Logout)
const {
    packageManagerLogin,
    refreshPackageManagerAccessToken,
    packageManagerLogout
} = require('../controllers/admin/auth.controller');

// Shared Package Controller
const {
    createPackage,
    listManagedPackages,
    getManagedPackage,
    modifyPackage,
    removePackage,
    changePackageStatus
} = require('../controllers/admin/package.controller');

// 1. Public Auth Routes (Before verifyJWT)
router.post('/auth/login', loginLimiter, validate(loginSchema), packageManagerLogin);
router.post('/auth/refresh-token', refreshPackageManagerAccessToken);
router.post('/auth/logout', packageManagerLogout);

// 2. Protect all routes below: Only PACKAGE_MANAGER role allowed
router.use(verifyJWT, authorizeRoles(USER_ROLES.PACKAGE_MANAGER));

// Package Manager Profile Check
router.get('/profile', (req, res) => {
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Package Manager profile fetched successfully',
        data: {
            user: req.user
        }
    });
});

// Package Management Endpoints (Create, List All, View by Slug, Update, Toggle Active, Soft Delete)
router.post('/create', validate(createPackageSchema), createPackage);
router.get('/packageList', validate(listPackagesQuerySchema), listManagedPackages);
router.get('/get/:slug', validate(packageSlugParamSchema), getManagedPackage);
router.patch('/update/:slug', validate(updatePackageSchema), modifyPackage);
router.patch('/packages/:slug/status', validate(togglePackageStatusSchema), changePackageStatus);
router.delete('/remove/:slug', validate(packageSlugParamSchema), removePackage);

module.exports = router;