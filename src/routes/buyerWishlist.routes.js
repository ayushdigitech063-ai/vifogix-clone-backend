const express = require('express');
const router = express.Router();

const {verifyJWT} = require('../middlewares/auth.middleware');
const {authorizeRoles} = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { USER_ROLES } = require('../constants/roles.constant');
const {
    toggleWishlistSchema,
    getWishlistQuerySchema,
    removeWishlistParamSchema
} = require('../validations/wishlist.validation');
const {
    toggleWishlist,
    getMyWishlist,
    getMyWishlistedIds,
    removeFromWishlist
} = require('../controllers/wishlist.controller');

// All routes protected for BUYER role
router.use(verifyJWT, authorizeRoles(USER_ROLES.BUYER));

router.post('/toggle', validate(toggleWishlistSchema), toggleWishlist);
router.get('/', validate(getWishlistQuerySchema), getMyWishlist);
router.get('/ids', getMyWishlistedIds);
router.delete('/:websiteId', validate(removeWishlistParamSchema), removeFromWishlist);

module.exports = router;