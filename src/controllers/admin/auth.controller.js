const asyncHandler = require('../../utils/asyncHandler');
const {
    loginAdmin,
    refreshAdminToken,
    logoutAdmin,
    getAllPlatformUsers,
    getSingleUserDetails,
    changeUserAccountStatus,
    deletePlatformUser
} = require('../../services/auth.service');
const { cookieOptions } = require('../../config/cookie.config');


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


const listAllUsers = asyncHandler(async (req, res) => {
    const data = await getAllPlatformUsers(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Platform users fetched successfully',
        data
    });
});


const getUserDetails = asyncHandler(async (req, res) => {
    const data = await getSingleUserDetails(req.params.userId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User details fetched successfully',
        data
    });
});


const updateUserStatus = asyncHandler(async (req, res) => {
    const user = await changeUserAccountStatus(req.params.userId, req.body.status);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `User status updated to ${req.body.status} successfully`,
        data: { user }
    });
});


const removeUser = asyncHandler(async (req, res) => {
    const result = await deletePlatformUser(req.params.userId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User deleted successfully',
        data: result
    });
});

module.exports = {
    login,
    refreshAccessToken,
    logout,
    listAllUsers,
    getUserDetails,
    updateUserStatus,
    removeUser
};