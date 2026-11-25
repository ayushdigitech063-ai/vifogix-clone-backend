const asyncHandler = require('../../utils/asyncHandler');
const {
    createSellerPressRelease,
    getSellerPressReleasesList,
    getSellerPressReleaseDetails,
    updateSellerPressRelease,
    deleteSellerPressRelease,
    getAdminPressReleasesList,
    getAdminPressReleaseDetails,
    updatePressReleaseStatusByAdmin,
    getPublicPressReleasesList,
    getPublicPressReleaseDetails
} = require('../../services/pressRelease.service');

// ==========================================
// SELLER CONTROLLERS
// ==========================================
const addPressRelease = asyncHandler(async (req, res) => {
    const pressRelease = await createSellerPressRelease(req.user._id, req.body);

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Press release package submitted for verification',
        data: { pressRelease }
    });
});

const getMyPressReleases = asyncHandler(async (req, res) => {
    const result = await getSellerPressReleasesList(req.user._id, req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Seller press releases fetched successfully',
        data: result
    });
});

const getSingleMyPressRelease = asyncHandler(async (req, res) => {
    const pressRelease = await getSellerPressReleaseDetails(req.user._id, req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release details fetched successfully',
        data: { pressRelease }
    });
});

const updateMyPressRelease = asyncHandler(async (req, res) => {
    const pressRelease = await updateSellerPressRelease(
        req.user._id,
        req.params.slug,
        req.body
    );

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release updated and submitted for re-verification',
        data: { pressRelease }
    });
});

const deleteMyPressRelease = asyncHandler(async (req, res) => {
    const result = await deleteSellerPressRelease(req.user._id, req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release deleted successfully',
        data: result
    });
});

// ==========================================
// ADMIN CONTROLLERS
// ==========================================
const getAllPressReleasesAdmin = asyncHandler(async (req, res) => {
    const result = await getAdminPressReleasesList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin press releases list fetched successfully',
        data: result
    });
});

const getSinglePressReleaseAdmin = asyncHandler(async (req, res) => {
    const pressRelease = await getAdminPressReleaseDetails(req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release details fetched successfully',
        data: { pressRelease }
    });
});

const reviewPressReleaseStatus = asyncHandler(async (req, res) => {
    const pressRelease = await updatePressReleaseStatusByAdmin(req.params.slug, req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Press release status updated to ${pressRelease.status}`,
        data: { pressRelease }
    });
});

// ==========================================
// PUBLIC CONTROLLERS
// ==========================================
const getPublicPressReleases = asyncHandler(async (req, res) => {
    const result = await getPublicPressReleasesList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press releases fetched successfully',
        data: result
    });
});

const getSinglePublicPressRelease = asyncHandler(async (req, res) => {
    const pressRelease = await getPublicPressReleaseDetails(req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release details fetched successfully',
        data: { pressRelease }
    });
});

module.exports = {
    addPressRelease,
    getMyPressReleases,
    getSingleMyPressRelease,
    updateMyPressRelease,
    deleteMyPressRelease,
    getAllPressReleasesAdmin,
    getSinglePressReleaseAdmin,
    reviewPressReleaseStatus,
    getPublicPressReleases,
    getSinglePublicPressRelease
};