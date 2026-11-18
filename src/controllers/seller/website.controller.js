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
    reviewAndVerifyWebsite
} = require('../../services/website.service');

// 0A. Public: Fetch Main Categories List for Dropdown 1 (GET /categories)
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

// 0B. Public: Fetch Subcategories for Selected Category for Dropdown 2 (GET /subcategories?category=SEO)
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

// 2. Single Website Add (Validated by addWebsiteSchema)
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

// 3. Bulk CSV Upload
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

// 4. View Seller Websites (Validated by listWebsitesQuerySchema)
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

// 5. Public / Buyer Marketplace Table ("Boost Your SEO with Trusted Guest Posts")
const getMarketplaceListings = asyncHandler(async (req, res) => {
    const data = await getPublicMarketplaceList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Marketplace websites retrieved successfully',
        data
    });
});

// 6. Admin: Get All Websites
const getAllWebsitesForAdmin = asyncHandler(async (req, res) => {
    const data = await getAdminWebsitesList(req.query);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin website listings fetched successfully',
        data
    });
});

// 7. Admin: Get Single Website Details
const getWebsiteDetailsForAdmin = asyncHandler(async (req, res) => {
    const website = await getAdminWebsiteById(req.params.websiteId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Website details fetched successfully',
        data: website
    });
});

// 8. Admin: Approve / Reject Website
const updateWebsiteVerificationStatus = asyncHandler(async (req, res) => {
    const updatedWebsite = await reviewAndVerifyWebsite(req.params.websiteId, req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Website status updated to ${updatedWebsite.status} successfully`,
        data: updatedWebsite
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
    updateWebsiteVerificationStatus
};