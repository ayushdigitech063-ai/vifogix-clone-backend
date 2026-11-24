const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { USER_ROLES } = require('../../constants/roles.constant');
const {
    createNewPackage,
    getAllManagedPackagesList,
    getManagedPackageDetails,
    getPublicPackagesList,
    getPublicPackageDetailsBySlug,
    calculateCustomPackagePrice,
    updatePackageBySlug,
    deletePackageBySlug,
    updatePackageStatusBySlug,
    reviewPackageBySlug
} = require('../../services/package.service');

// 1. Shared (Package Manager & Admin): Create Single Package
const createPackage = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized access');
    }

    const pkg = await createNewPackage(req.user, req.body);

    const message =
        req.user.role === USER_ROLES.ADMIN
            ? 'Package created and published successfully'
            : 'Package created successfully and submitted for Admin verification';

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message,
        data: { package: pkg }
    });
});

// 2. Shared (Admin & Package Manager): List All Packages
const listManagedPackages = asyncHandler(async (req, res) => {
    const data = await getAllManagedPackagesList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Packages fetched successfully',
        data
    });
});

// 3. Shared (Admin & Package Manager): Get Single Package Details by Slug
const getManagedPackage = asyncHandler(async (req, res) => {
    const pkg = await getManagedPackageDetails(req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Package details fetched successfully',
        data: { package: pkg }
    });
});

// 4. Shared (Admin & Package Manager): Update Package by Slug
const modifyPackage = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized access');
    }

    const pkg = await updatePackageBySlug(req.user, req.params.slug, req.body);

    const message =
        pkg.status === 'PENDING_VERIFICATION'
            ? 'Package updated and resubmitted for verification'
            : 'Package updated successfully';

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message,
        data: { package: pkg }
    });
});

// 5. Shared (Admin & Package Manager): Soft Delete Package by Slug
const removePackage = asyncHandler(async (req, res) => {
    const result = await deletePackageBySlug(req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Package deleted successfully',
        data: result
    });
});

// 6. Shared (Admin & Package Manager): Toggle Active Status by Slug
const changePackageStatus = asyncHandler(async (req, res) => {
    const pkg = await updatePackageStatusBySlug(req.params.slug, req.body.isActive);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Package ${pkg.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { package: pkg }
    });
});

// 7. Admin Only: Verify / Approve / Reject / Suspend Package by Slug
const reviewPackageVerification = asyncHandler(async (req, res) => {
    const pkg = await reviewPackageBySlug(req.params.slug, req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Package status updated to ${pkg.status} successfully`,
        data: { package: pkg }
    });
});

// 8. Public: List Verified & Active Packages
const listPublicPackages = asyncHandler(async (req, res) => {
    const packages = await getPublicPackagesList();

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Packages fetched successfully',
        data: { packages }
    });
});

// 9. Public: Get Single Verified Package Details by Slug
const getPublicPackageDetails = asyncHandler(async (req, res) => {
    const pkg = await getPublicPackageDetailsBySlug(req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Package details fetched successfully',
        data: { package: pkg }
    });
});

// 10. Public/Buyer: Live Add-On Price Calculator
const getCalculatedPackagePrice = asyncHandler(async (req, res) => {
    const pricing = await calculateCustomPackagePrice(req.params.slug, req.body.customizations);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Package price calculated successfully',
        data: pricing
    });
});

module.exports = {
    createPackage,
    listManagedPackages,
    getManagedPackage,
    modifyPackage,
    removePackage,
    changePackageStatus,
    reviewPackageVerification,
    listPublicPackages,
    getPublicPackageDetails,
    getCalculatedPackagePrice
};