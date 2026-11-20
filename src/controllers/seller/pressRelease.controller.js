const asyncHandler = require('../../utils/asyncHandler');
const {
    createSellerPressRelease,
    getSellerPressReleasesList,
    getSellerPressReleaseDetailsById,
    updateSellerPressReleaseById,
    deleteSellerPressReleaseById,
    getAdminPressReleasesList,
    getAdminPressReleaseDetailsById,
    updatePressReleaseStatusByAdmin,
    getPublicPressReleasesList,
    getPublicPressReleaseDetailsById
} = require('../../services/pressRelease.service');


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


const getMyPressReleaseById = asyncHandler(async (req, res) => {
    const pressRelease = await getSellerPressReleaseDetailsById(req.user._id, req.params.prId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release details fetched successfully',
        data: { pressRelease }
    });
});


const updateMyPressRelease = asyncHandler(async (req, res) => {
    const pressRelease = await updateSellerPressReleaseById(
        req.user._id,
        req.params.prId,
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
    const result = await deleteSellerPressReleaseById(req.user._id, req.params.prId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release deleted successfully',
        data: result
    });
});

const getAllPressReleasesAdmin = asyncHandler(async (req, res) => {
    const result = await getAdminPressReleasesList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin press releases list fetched successfully',
        data: result
    });
});

// 2. Admin: Get Single Press Release by ID (GET /api/v1/admin/press-releases/:prId)
const getPressReleaseByIdAdmin = asyncHandler(async (req, res) => {
    const pressRelease = await getAdminPressReleaseDetailsById(req.params.prId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press release details fetched successfully',
        data: { pressRelease }
    });
});

// 3. Admin: Verify / Approve / Reject / Suspend Press Release (PATCH /api/v1/admin/press-releases/:prId/status)
const reviewPressReleaseStatus = asyncHandler(async (req, res) => {
    const pressRelease = await updatePressReleaseStatusByAdmin(req.params.prId, req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Press release status updated to ${pressRelease.status}`,
        data: { pressRelease }
    });
});

const getPublicPressReleases = asyncHandler(async (req, res) => {
    const result = await getPublicPressReleasesList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Press releases fetched successfully',
        data: result
    });
});

// 2. Public: Get Single Press Release Detail Page (GET /api/v1/public/press-releases/:prId)
const getPublicPressReleaseById = asyncHandler(async (req, res) => {
    const pressRelease = await getPublicPressReleaseDetailsById(req.params.prId);

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
    getMyPressReleaseById,
    updateMyPressRelease,
    deleteMyPressRelease,
    getAllPressReleasesAdmin,
    getPressReleaseByIdAdmin,
    reviewPressReleaseStatus,
    getPublicPressReleases,
    getPublicPressReleaseById
};