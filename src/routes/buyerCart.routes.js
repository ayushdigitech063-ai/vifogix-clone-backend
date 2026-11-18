const express = require('express');
const router = express.Router();

const {verifyJWT} = require('../middlewares/auth.middleware');
const {authorizeRoles} = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { USER_ROLES } = require('../constants/roles.constant');
const {
    addToCartSchema,
    updateCartItemSchema,
    cartItemParamSchema
} = require('../validations/cart.validation');
const {
    addToCart,
    getMyCart,
    updateMyCartItem,
    deleteMyCartItem,
    emptyMyCart
} = require('../controllers/cart.controller');

router.use(verifyJWT, authorizeRoles(USER_ROLES.BUYER));


router.get('/', getMyCart);

router.post('/items', validate(addToCartSchema), addToCart);

router.patch('/items/:itemId', validate(updateCartItemSchema), updateMyCartItem);


router.delete('/items/:itemId', validate(cartItemParamSchema), deleteMyCartItem);


router.delete('/clear', emptyMyCart);

module.exports = router;