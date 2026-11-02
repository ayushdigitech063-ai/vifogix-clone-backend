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

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id).select('-password');

        if (!user) {
            throw ApiError(401, 'Invalid Access Token. User not found.');
        }

        if (user.status === 'SUSPENDED') {
            throw ApiError(403, 'Your account has been suspended.');
        }

        // Request object me user attach karega
        req.user = user;
        next();
    } catch (err) {
        throw ApiError(401, 'Access token expired or invalid.');
    }
});

module.exports = { verifyJWT };