const jwt = require('jsonwebtoken');

// Access Token: Short-lived (Default: 15m)
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            _id: user._id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
    );
};

// Refresh Token: Long-lived (Default: 7d)
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            _id: user._id.toString(),
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );
};

module.exports = {
    generateAccessToken,
    generateRefreshToken
};