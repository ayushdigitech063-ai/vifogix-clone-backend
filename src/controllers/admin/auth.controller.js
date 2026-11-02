const asyncHandler = require('../../utils/asyncHandler');
const { loginAdmin, refreshAdminToken, logoutAdmin } = require('../../services/auth.service');
const { cookieOptions } = require('../../config/cookie.config');

// 1. Login Controller
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { admin, accessToken, refreshToken } = await loginAdmin(email, password);

    // Refresh token safely browser ke httpOnly cookie me
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

// 2. Refresh Token Controller
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    const tokens = await refreshAdminToken(incomingRefreshToken);

    // Naya refresh token cookie me update
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

// 3. Logout Controller
const logout = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (userId) {
        await logoutAdmin(userId);
    }

    // Cookie remove ki
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