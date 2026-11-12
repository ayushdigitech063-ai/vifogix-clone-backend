const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const {
    getDomainRegistrationHistory,
    addSingleWebsite,
    processBulkCsvUpload,
    getSellerWebsitesList
} = require('../../services/website.service');

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
    if (!req.file?.path) {
        throw ApiError(400, 'Please upload a valid .csv file');
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
    const data = await getSellerWebsitesList(req.user._id, req.query);

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