const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const { WEBSITE_CATEGORIES, VALID_CATEGORY_NAMES } = require('../../constants/category.constant');
const {
    getDomainRegistrationHistory,
    addSingleWebsite,
    processBulkCsvUpload,
    getSellerWebsitesList,
    getPublicMarketplaceList,
    getAdminWebsitesList,
    getAdminWebsiteById,
    reviewAndVerifyWebsite,
    getPublicWebsiteDetailsById,
    updateSellerWebsiteById,
    getSellerWebsiteDetailsById
} = require('../../services/website.service');

const getMainCategories = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Main categories fetched successfully',
        data: {
            categories: VALID_CATEGORY_NAMES
        }
    });
});

const getSubCategoriesByCategory = asyncHandler(async (req, res) => {
    const { category } = req.query;

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Subcategories for '${category}' fetched successfully`,
        data: {
            category,
            subCategories: WEBSITE_CATEGORIES[category] || []
        }
    });
});

// 1. Live Check Domain Info (Validated by checkDomainQuerySchema)
const checkDomainStats = asyncHandler(async (req, res) => {
    const stats = await getDomainRegistrationHistory(req.query.domain);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Domain stats fetched successfully',
        data: stats
    });
});

const createSingleListing = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized seller access');
    }

    const { website, domainStats } = await addSingleWebsite(req.user._id, req.body);

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Website registered successfully and submitted for Admin verification.',
        data: { website, domainStats }
    });
});

const uploadBulkCsvListings = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized seller access');
    }

    if (!req.file?.path) {
        throw ApiError(400, 'Please upload a valid .csv file', [
            { field: 'file', message: 'CSV file is required' }
        ]);
    }

    const result = await processBulkCsvUpload(req.user._id, req.file.path);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bulk CSV websites processed successfully',
        data: result
    });
});

const getMyListings = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized seller access');
    }

    const data = await getSellerWebsitesList(req.user._id, req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Your website listings retrieved successfully',
        data
    });
});

const getMarketplaceListings = asyncHandler(async (req, res) => {
    const data = await getPublicMarketplaceList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Marketplace websites retrieved successfully',
        data
    });
});

const getAllWebsitesForAdmin = asyncHandler(async (req, res) => {
    const data = await getAdminWebsitesList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin website listings fetched successfully',
        data
    });
});

// 7. Admin: Get Single Website Details by Slug
const getWebsiteDetailsForAdmin = asyncHandler(async (req, res) => {
    const website = await getAdminWebsiteById(req.params.slug || req.params.websiteId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Website details fetched successfully',
        data: website
    });
});

// 8. Admin: Verify / Review Website by Slug
const updateWebsiteVerificationStatus = asyncHandler(async (req, res) => {
    const updatedWebsite = await reviewAndVerifyWebsite(
        req.params.slug || req.params.websiteId,
        req.body
    );

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Website status updated to ${updatedWebsite.status} successfully`,
        data: updatedWebsite
    });
});

const getPublicWebsiteDetails = asyncHandler(async (req, res) => {
    const website = await getPublicWebsiteDetailsById(req.params.slug || req.params.websiteId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Website details fetched successfully',
        data: { website }
    });
});

const updateMyListing = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized seller access');
    }

    const website = await updateSellerWebsiteById(
        req.user._id,
        req.params.slug || req.params.websiteId,
        req.body
    );

    const message =
        website.status === 'PENDING_VERIFICATION'
            ? 'Website updated and submitted for verification.'
            : 'Website updated successfully.';

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message,
        data: { website }
    });
});

const getMyWebsiteDetails = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw ApiError(401, 'Unauthorized seller access');
    }

    const website = await getSellerWebsiteDetailsById(
        req.user._id,
        req.params.slug || req.params.websiteId
    );

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Website details fetched successfully',
        data: { website }
    });
});

module.exports = {
    getMainCategories,
    getSubCategoriesByCategory,
    checkDomainStats,
    createSingleListing,
    uploadBulkCsvListings,
    getMyListings,
    getMarketplaceListings,
    getAllWebsitesForAdmin,
    getWebsiteDetailsForAdmin,
    updateWebsiteVerificationStatus,
    getPublicWebsiteDetails,
    updateMyListing,
    getMyWebsiteDetails
};