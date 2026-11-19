const asyncHandler = require('../../utils/asyncHandler');
const {
    createNewPackage,
    getAdminPackagesList,
    getPublicPackagesList,
    updatePackageById,
    deletePackageById
} = require('../../services/package.service');

// 1. Admin: Create Single Package (POST /api/v1/admin/packages)
const createPackage = asyncHandler(async (req, res) => {
    const pkg = await createNewPackage(req.body);

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Package created successfully',
        data: { package: pkg }
    });
});

// 2. Admin: List All Packages (GET /api/v1/admin/packages)
const listAdminPackages = asyncHandler(async (req, res) => {
    const packages = await getAdminPackagesList();

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin packages fetched successfully',
        data: { packages }
    });
});

// 3. Public: List Active Packages (GET /api/v1/public/packages)
const listPublicPackages = asyncHandler(async (req, res) => {
    const packages = await getPublicPackagesList();

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Packages fetched successfully',
        data: { packages }
    });
});

// 4. Admin: Update Package (PATCH /api/v1/admin/packages/:packageId)
const modifyPackage = asyncHandler(async (req, res) => {
    const pkg = await updatePackageById(req.params.packageId, req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Package updated successfully',
        data: { package: pkg }
    });
});

// 5. Admin: Delete Package (DELETE /api/v1/admin/packages/:packageId)
const removePackage = asyncHandler(async (req, res) => {
    const result = await deletePackageById(req.params.packageId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Package deleted successfully',
        data: result
    });
});

module.exports = {
    createPackage,
    listAdminPackages,
    listPublicPackages,
    modifyPackage,
    removePackage
};