const asyncHandler = require('../../utils/asyncHandler');
const { registerUser, loginUser } = require('../../services/userAuth.service');
const { logoutAdmin } = require('../../services/auth.service');
const { cookieOptions } = require('../../config/cookie.config');

const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const { user, accessToken, refreshToken } = await registerUser({
        name,
        email,
        password,
        role
    });

    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Account registered successfully',
        data: {
            user,
            accessToken
        }
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await loginUser(email, password);

    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Login successful',
        data: {
            user,
            accessToken
        }
    });
});

const logout = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (userId) {
        await logoutAdmin(userId);
    }

    res.clearCookie('refreshToken', cookieOptions);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Logged out successfully',
        data: {}
    });
});

const getProfile = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Profile fetched successfully',
        data: {
            user: req.user
        }
    });
});

module.exports = {
    register,
    login,
    logout,
    getProfile
};