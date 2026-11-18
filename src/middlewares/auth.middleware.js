const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/user.model');

const verifyJWT = asyncHandler(async (req, res, next) => {
    // Header ya cookies dono se token read karega
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw ApiError(401, 'Unauthorized request. No token provided.');
    }

    // Sirf jwt.verify ko try-catch me rakho taaki 403 errors overwrite na hon
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw ApiError(401, 'Access token expired or invalid.');
    }

    const user = await User.findById(decodedToken._id).select('-password -refreshToken -__v');

    if (!user || user.isDeleted) {
        throw ApiError(401, 'Invalid Access Token. User account does not exist.');
    }

    if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
        throw ApiError(403, `Your account has been ${user.status.toLowerCase()}.`);
    }

    if (user.status === 'PENDING') {
        throw ApiError(403, 'Your account is pending admin approval.');
    }

    // Request object me user attach karega
    req.user = user;
    next();
});

module.exports = { verifyJWT };