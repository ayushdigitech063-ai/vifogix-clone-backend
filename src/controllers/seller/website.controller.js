const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const {
    getDomainRegistrationHistory,
    addSingleWebsite,
    processBulkCsvUpload,
    getSellerWebsitesList
} = require('../../services/website.service');

// 1. Live Check Domain Info (Sidebar / Form input check)
const checkDomainStats = asyncHandler(async (req, res) => {
    const { domain } = req.query;
    if (!domain) {
        throw ApiError(400, 'Domain query parameter is required');
    }

    const stats = await getDomainRegistrationHistory(domain);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Domain stats fetched successfully',
        data: stats
    });
});

// 2. Single Website Add
const createSingleListing = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;

    // Check mandatory country
    if (!req.body.country || !req.body.country.trim()) {
        throw ApiError(400, 'Country is required');
    }

    const { website, domainStats } = await addSingleWebsite(sellerId, req.body);

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Website registered successfully and submitted for Admin verification.',
        data: { website, domainStats }
    });
});

// 3. Bulk CSV 1000+ Upload
const uploadBulkCsvListings = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    const csvFilePath = req.file?.path;

    if (!csvFilePath) {
        throw ApiError(400, 'Please upload a valid .csv file');
    }

    const result = await processBulkCsvUpload(sellerId, csvFilePath);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bulk CSV websites processed successfully',
        data: result
    });
});

// 4. View Seller Websites (With Pagination, Search & Country filter)
const getMyListings = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    const { page, limit, status, category, country, search } = req.query;

    const data = await getSellerWebsitesList(sellerId, {
        page,
        limit,
        status,
        category,
        country,
        search
    });

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Your website listings retrieved successfully',
        data
    });
});

module.exports = {
    checkDomainStats,
    createSingleListing,
    uploadBulkCsvListings,
    getMyListings
};