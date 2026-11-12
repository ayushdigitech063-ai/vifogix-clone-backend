const asyncHandler = require('../../utils/asyncHandler');
const { loginAdmin, refreshAdminToken, logoutAdmin } = require('../../services/auth.service');
const { cookieOptions } = require('../../config/cookie.config');

// 1. Admin Login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { admin, accessToken, refreshToken } = await loginAdmin(email, password);

    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin login successful',
        data: {
            admin,
            accessToken
        }
    });
});

// 2. Admin Refresh Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    const tokens = await refreshAdminToken(incomingRefreshToken);

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Access token refreshed successfully',
        data: {
            accessToken: tokens.accessToken
        }
    });
});

// 3. Admin Logout
const logout = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
        await logoutAdmin(incomingRefreshToken);
    }

    res.clearCookie('refreshToken', cookieOptions);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin logged out successfully',
        data: {}
    });
});

module.exports = {
    login,
    refreshAccessToken,
    logout
};