const asyncHandler = require('../utils/asyncHandler');
const {
    getAllActiveProjects,
    getPublicProjectBySlug,
    getAllProjectsForAdmin,
    getAdminProjectByIdentifier,
    addProject,
    updateProjectByIdentifier,
    deleteProjectByIdentifier
} = require('../services/portfolio.service');

// ============================================================================
// PUBLIC CONTROLLERS
// ============================================================================

const getPublicPortfolioList = asyncHandler(async (req, res) => {
    const projects = await getAllActiveProjects(req.query.category);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio projects fetched successfully',
        data: { projects }
    });
});

const getPublicPortfolioDetails = asyncHandler(async (req, res) => {
    const project = await getPublicProjectBySlug(req.params.slug);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio project details fetched successfully',
        data: { project }
    });
});

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

const getAdminPortfolioList = asyncHandler(async (req, res) => {
    const projects = await getAllProjectsForAdmin(req.query.category);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Admin portfolio projects fetched successfully',
        data: { projects }
    });
});

const getAdminPortfolioDetails = asyncHandler(async (req, res) => {
    const project = await getAdminProjectByIdentifier(req.params.identifier);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio project details fetched successfully',
        data: { project }
    });
});

const createPortfolio = asyncHandler(async (req, res) => {
    const project = await addProject(req.body, req.file?.path);

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Portfolio project created successfully',
        data: { project }
    });
});

const modifyPortfolio = asyncHandler(async (req, res) => {
    const project = await updateProjectByIdentifier(
        req.params.identifier,
        req.body,
        req.file?.path
    );

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio project updated successfully',
        data: { project }
    });
});

const removePortfolio = asyncHandler(async (req, res) => {
    await deleteProjectByIdentifier(req.params.identifier);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio project and its cloud image deleted successfully',
        data: {}
    });
});

module.exports = {
    getPublicPortfolioList,
    getPublicPortfolioDetails,
    getAdminPortfolioList,
    getAdminPortfolioDetails,
    createPortfolio,
    modifyPortfolio,
    removePortfolio
};