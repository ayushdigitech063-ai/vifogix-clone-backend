const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Website = require('../models/website.model');
const Cart = require('../models/cart.model');
const ApiError = require('../utils/ApiError');
const { USER_ROLES } = require('../constants/roles.constant');
const { generateAccessToken, generateRefreshToken } = require('./token.service');


const loginAdmin = async (email, password) => {
    const admin = await User.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
        throw ApiError(401, 'Invalid credentials');
    }

    if (admin.role !== USER_ROLES.ADMIN) {
        throw ApiError(403, 'Access denied. Only admins can login here.');
    }

    if (admin.status !== 'ACTIVE') {
        throw ApiError(403, `Admin account is ${admin.status.toLowerCase()}. Access denied.`);
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

    if (admin.role !== USER_ROLES.ADMIN) {
        throw ApiError(403, 'Access denied. Only admins allowed.');
    }

    if (admin.refreshToken !== incomingRefreshToken) {
        throw ApiError(401, 'Refresh token is expired or already used');
    }

    const newAccessToken = generateAccessToken(admin);
    const newRefreshToken = generateRefreshToken(admin);

    admin.refreshToken = newRefreshToken;
    await admin.save({ validateBeforeSave: false });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
};

const logoutAdmin = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) return;

    await User.findOneAndUpdate(
        { refreshToken: incomingRefreshToken },
        { $set: { refreshToken: null } },
        { new: true }
    );
};


const formatUserForAdmin = (user) => {
    const baseData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
    };

    if (user.role === USER_ROLES.SELLER) {
        baseData.socialProfiles = {
            linkedin: user.socialProfiles?.linkedin || null,
            facebook: user.socialProfiles?.facebook || null,
            instagram: user.socialProfiles?.instagram || null
        };
    }

    return baseData;
};


const getAllPlatformUsers = async ({ page = 1, limit = 10, role, status, search }) => {
    const baseFilter = {
        role: { $in: [USER_ROLES.BUYER, USER_ROLES.SELLER] },
        isDeleted: { $ne: true }
    };
    const queryFilter = { ...baseFilter };

    if (role) queryFilter.role = role;
    if (status) queryFilter.status = status;

    if (search) {
        const safeRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        queryFilter.$or = [{ name: safeRegex }, { email: safeRegex }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [
        rawUsers,
        totalFiltered,
        totalBuyers,
        totalSellers,
        activeUsers,
        pendingUsers,
        rejectedUsers
    ] = await Promise.all([
        User.find(queryFilter)
            .select('-password -refreshToken -__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        User.countDocuments(queryFilter),
        User.countDocuments({ role: USER_ROLES.BUYER, isDeleted: { $ne: true } }),
        User.countDocuments({ role: USER_ROLES.SELLER, isDeleted: { $ne: true } }),
        User.countDocuments({ ...baseFilter, status: 'ACTIVE' }),
        User.countDocuments({ ...baseFilter, status: 'PENDING' }),
        User.countDocuments({ ...baseFilter, status: 'REJECTED' })
    ]);

    const users = rawUsers.map(formatUserForAdmin);

    return {
        stats: {
            totalUsers: totalBuyers + totalSellers,
            totalBuyers,
            totalSellers,
            activeUsers,
            pendingUsers,
            rejectedUsers
        },
        users,
        pagination: {
            total: totalFiltered,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(totalFiltered / Number(limit))
        }
    };
};


const getSingleUserDetails = async (userId) => {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } })
        .select('-password -refreshToken -__v')
        .lean();

    if (!user || user.role === USER_ROLES.ADMIN) {
        throw ApiError(404, 'User not found');
    }

    const formattedUser = formatUserForAdmin(user);
    let activitySummary = {};

    if (user.role === USER_ROLES.SELLER) {
        const [totalWebsites, activeWebsites, pendingWebsites, recentWebsites] = await Promise.all([
            Website.countDocuments({ sellerId: user._id }),
            Website.countDocuments({ sellerId: user._id, status: 'ACTIVE' }),
            Website.countDocuments({ sellerId: user._id, status: 'PENDING_VERIFICATION' }),
            Website.find({ sellerId: user._id })
                .select('domain category price status isVerified mozDA ahrefsDR createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
        ]);

        activitySummary = {
            totalWebsites,
            activeWebsites,
            pendingWebsites,
            recentWebsites
        };
    } else if (user.role === USER_ROLES.BUYER) {
        const cart = await Cart.findOne({ buyerId: user._id }).lean();
        activitySummary = {
            cartItemsCount: cart?.items?.length || 0
        };
    }

    return {
        user: formattedUser,
        activitySummary
    };
};


const changeUserAccountStatus = async (userId, status) => {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });

    if (!user || user.role === USER_ROLES.ADMIN) {
        throw ApiError(404, 'User not found or cannot modify admin account');
    }

    if (user.status === status) {
        throw ApiError(400, `User account is already ${status}`);
    }

    user.status = status;

    if (status === 'PENDING' || status === 'REJECTED') {
        user.refreshToken = null;
    }

    await user.save({ validateBeforeSave: false });

    return formatUserForAdmin(user.toObject());
};

// 4. Soft Delete User Account
const deletePlatformUser = async (userId) => {
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } });

    if (!user || user.role === USER_ROLES.ADMIN) {
        throw ApiError(404, 'User not found or cannot delete admin account');
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.refreshToken = null;

    await user.save({ validateBeforeSave: false });
    await Cart.deleteOne({ buyerId: userId });

    return {
        deletedUserId: user._id,
        email: user.email,
        deletedAt: user.deletedAt
    };
};


module.exports = {
    loginAdmin,
    refreshAdminToken,
    logoutAdmin,
    getAllPlatformUsers,
    getSingleUserDetails,
    changeUserAccountStatus,
    deletePlatformUser
};