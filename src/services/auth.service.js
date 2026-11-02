const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { USER_ROLES } = require('../constants/roles.constant');
const { generateAccessToken, generateRefreshToken } = require('./token.service');

const loginAdmin = async (email, password) => {
    const admin = await User.findOne({ email });
    if (!admin) {
        throw ApiError(401, 'Invalid credentials');
    }

    if (admin.role !== USER_ROLES.ADMIN) {
        throw ApiError(403, 'Access denied. Only admins can login here.');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
        throw ApiError(401, 'Invalid credentials');
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return {
        admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        },
        accessToken,
        refreshToken
    };
};

const refreshAdminToken = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        throw ApiError(401, 'Unauthorized request. Refresh token missing.');
    }

    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw ApiError(401, 'Refresh token expired or invalid');
    }

    const admin = await User.findById(decoded._id);
    if (!admin) {
        throw ApiError(401, 'User does not exist');
    }

    // DB me stored refresh token se compare karein
    if (admin.refreshToken !== incomingRefreshToken) {
        throw ApiError(401, 'Refresh token is expired or already used');
    }

    // Token Rotation: Naya Access Token aur naya Refresh Token issue karein
    const newAccessToken = generateAccessToken(admin);
    const newRefreshToken = generateRefreshToken(admin);

    admin.refreshToken = newRefreshToken;
    await admin.save({ validateBeforeSave: false });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};

const logoutAdmin = async (userId) => {
    await User.findByIdAndUpdate(
        userId,
        { $set: { refreshToken: null } },
        { new: true }
    );
};

module.exports = {
    loginAdmin,
    refreshAdminToken,
    logoutAdmin
};