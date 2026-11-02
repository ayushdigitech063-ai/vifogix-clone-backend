const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minutes window
    max: 5, // Ek IP se maximum 5 login attempts
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(ApiError(429, 'Too many login attempts. Please try again after 15 minutes.'));
    }
});

module.exports = {
    loginLimiter
};