const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { USER_ROLES } = require('../constants/roles.constant');
const { generateAccessToken, generateRefreshToken } = require('./token.service');

const registerUser = async ({ name, email, password, role, socialProfiles }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw ApiError(409, 'An account with this email already exists.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData = {
        name,
        email,
        password: hashedPassword,
        role
    };

    // Buyer ke liye key create nahi hogi, sirf Seller ke liye save hogi
    if (role === USER_ROLES.SELLER && socialProfiles) {
        userData.socialProfiles = {
            linkedin: socialProfiles.linkedin || null,
            facebook: socialProfiles.facebook || null,
            instagram: socialProfiles.instagram || null
        };
    }

    const newUser = await User.create(userData);

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    const userResponse = {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
    };

    if (newUser.role === USER_ROLES.SELLER) {
        userResponse.socialProfiles = newUser.socialProfiles;
    }

    return {
        user: userResponse,
        accessToken,
        refreshToken
    };
};

const loginUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw ApiError(401, 'Invalid email or password.');
    }

    if (user.role === USER_ROLES.ADMIN) {
        throw ApiError(403, 'Admins must login through the admin portal.');
    }

    if (user.status === 'SUSPENDED') {
        throw ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw ApiError(401, 'Invalid email or password.');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
    };

    if (user.role === USER_ROLES.SELLER && user.socialProfiles) {
        userResponse.socialProfiles = user.socialProfiles;
    }

    return {
        user: userResponse,
        accessToken,
        refreshToken
    };
};

module.exports = {
    registerUser,
    loginUser
};