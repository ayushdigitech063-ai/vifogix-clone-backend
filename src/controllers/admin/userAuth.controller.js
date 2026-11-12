const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { USER_ROLES } = require('../../constants/roles.constant');
const { 
    registerUser, 
    loginUser, 
    refreshUserToken, 
    logoutUser 
} = require('../../services/userAuth.service');
const { cookieOptions } = require('../../config/cookie.config');

const getCookieNameByRole = (role) => {
    return role === USER_ROLES.SELLER ? 'seller_refreshToken' : 'buyer_refreshToken';
};

// 1. Register
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, socialProfiles } = req.body;

    const { user, accessToken, refreshToken } = await registerUser({
        name,
        email,
        password,
        role,
        socialProfiles
    });

    const cookieName = getCookieNameByRole(user.role);
    res.cookie(cookieName, refreshToken, cookieOptions);

    return res
        .status(201)
        .json(ApiResponse(201, { user, accessToken }, 'Account registered successfully'));
});

// 2. Login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await loginUser(email, password);

    const cookieName = getCookieNameByRole(user.role);
    res.cookie(cookieName, refreshToken, cookieOptions);

    return res
        .status(200)
        .json(ApiResponse(200, { user, accessToken }, 'Login successful'));
});

// 3A. Seller Refresh Token
const refreshSellerAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.seller_refreshToken;

    if (!incomingRefreshToken) {
        throw ApiError(401, 'Seller session expired or refresh token not found');
    }

    const tokens = await refreshUserToken(incomingRefreshToken, USER_ROLES.SELLER);

    res.cookie('seller_refreshToken', tokens.refreshToken, cookieOptions);

    return res
        .status(200)
        .json(ApiResponse(200, { accessToken: tokens.accessToken }, 'Seller access token refreshed successfully'));
});

// 3B. Buyer Refresh Token
const refreshBuyerAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.buyer_refreshToken;

    if (!incomingRefreshToken) {
        throw ApiError(401, 'Buyer session expired or refresh token not found');
    }

    const tokens = await refreshUserToken(incomingRefreshToken, USER_ROLES.BUYER);

    res.cookie('buyer_refreshToken', tokens.refreshToken, cookieOptions);

    return res
        .status(200)
        .json(ApiResponse(200, { accessToken: tokens.accessToken }, 'Buyer access token refreshed successfully'));
});

// 4A. Seller Logout
const logoutSeller = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.seller_refreshToken;
    await logoutUser(incomingRefreshToken);

    res.clearCookie('seller_refreshToken', cookieOptions);

    return res
        .status(200)
        .json(ApiResponse(200, {}, 'Seller logged out successfully'));
});

// 4B. Buyer Logout
const logoutBuyer = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.buyer_refreshToken;
    await logoutUser(incomingRefreshToken);

    res.clearCookie('buyer_refreshToken', cookieOptions);

    return res
        .status(200)
        .json(ApiResponse(200, {}, 'Buyer logged out successfully'));
});

// 5. Get User Profile
const getProfile = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(ApiResponse(200, { user: req.user }, 'Profile fetched successfully'));
});

module.exports = {
    register,
    login,
    refreshSellerAccessToken,
    refreshBuyerAccessToken,
    logoutSeller,
    logoutBuyer,
    getProfile
};