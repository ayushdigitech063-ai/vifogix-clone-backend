const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadOnCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const {
    getAllActiveProjects,
    getProjectById,
    addProject,
    updateProjectById,
    deleteProjectById
} = require('../services/portfolio.service');

// Public Handler: Website portfolio cards fetch karne ke liye
const getPortfolioList = asyncHandler(async (req, res) => {
    const { category } = req.query;
    const projects = await getAllActiveProjects(category);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio projects fetched successfully',
        data: { projects }
    });
});

// Admin Handler: Single project add karna image ke sath
const createPortfolio = asyncHandler(async (req, res) => {
    const {
        title,
        domainUrl,
        category,
        description,
        lighthouse,
        technologies,
        isVerified,
        coreWebVitalsPassed,
        order
    } = req.body;

    if (!title || !domainUrl || !category || !description) {
        throw ApiError(400, 'Title, domainUrl, category, and description are required fields');
    }

    const localFilePath = req.file?.path;
    if (!localFilePath) {
        throw ApiError(400, 'Thumbnail image file is strictly required');
    }

    const thumbnailUrl = await uploadOnCloudinary(localFilePath);
    if (!thumbnailUrl) {
        throw ApiError(500, 'Failed to upload image to Cloudinary');
    }

    let parsedLighthouse = {
        overall: 95,
        performance: 95,
        accessibility: 95,
        bestPractices: 95,
        seo: 95
    };
    if (lighthouse) {
        parsedLighthouse = typeof lighthouse === 'string' ? JSON.parse(lighthouse) : lighthouse;
    }

    let parsedTechnologies = [];
    if (technologies) {
        parsedTechnologies = typeof technologies === 'string' ? JSON.parse(technologies) : technologies;
    }

    const project = await addProject({
        title,
        domainUrl,
        category,
        thumbnail: thumbnailUrl,
        description,
        lighthouse: parsedLighthouse,
        technologies: parsedTechnologies,
        isVerified: isVerified !== undefined ? (isVerified === 'true' || isVerified === true) : true,
        coreWebVitalsPassed: coreWebVitalsPassed !== undefined ? (coreWebVitalsPassed === 'true' || coreWebVitalsPassed === true) : true,
        order: order ? Number(order) : 0
    });

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Portfolio project created successfully',
        data: { project }
    });
});

// Admin Handler: Single project modify karna (text-only ya new image ke sath)
const modifyPortfolio = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const existingProject = await getProjectById(projectId);
    const updatePayload = { ...req.body };

    if (req.file?.path) {
        const newThumbnailUrl = await uploadOnCloudinary(req.file.path);
        if (!newThumbnailUrl) {
            throw ApiError(500, 'Failed to upload new image to Cloudinary');
        }

        if (existingProject.thumbnail) {
            await deleteFromCloudinary(existingProject.thumbnail);
        }

        updatePayload.thumbnail = newThumbnailUrl;
    }

    if (updatePayload.lighthouse && typeof updatePayload.lighthouse === 'string') {
        updatePayload.lighthouse = JSON.parse(updatePayload.lighthouse);
    }
    if (updatePayload.technologies && typeof updatePayload.technologies === 'string') {
        updatePayload.technologies = JSON.parse(updatePayload.technologies);
    }
    if (updatePayload.isVerified !== undefined) {
        updatePayload.isVerified = updatePayload.isVerified === 'true' || updatePayload.isVerified === true;
    }
    if (updatePayload.coreWebVitalsPassed !== undefined) {
        updatePayload.coreWebVitalsPassed = updatePayload.coreWebVitalsPassed === 'true' || updatePayload.coreWebVitalsPassed === true;
    }

    const updatedProject = await updateProjectById(projectId, updatePayload);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio project updated successfully',
        data: { project: updatedProject }
    });
});

// Admin Handler: Delete project (DB + Cloudinary cleanup)
const removePortfolio = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const existingProject = await getProjectById(projectId);

    if (existingProject.thumbnail) {
        await deleteFromCloudinary(existingProject.thumbnail);
    }

    await deleteProjectById(projectId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Portfolio project and its cloud image deleted successfully',
        data: {}
    });
});

module.exports = {
    getPortfolioList,
    createPortfolio,
    modifyPortfolio,
    removePortfolio
};