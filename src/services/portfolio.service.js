const Portfolio = require('../models/portfolio.model');
const ApiError = require('../utils/ApiError');
const {
    uploadOnCloudinary,
    deleteFromCloudinary,
    removeLocalFile
} = require('../utils/cloudinary');

// Helper: Title se collision-proof unique slug generate karne ke liye
const generateUniquePortfolioSlug = async (title, excludeId = null) => {
    const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    let slug = baseSlug || `project-${Date.now()}`;
    let counter = 1;

    while (true) {
        const query = { slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existing = await Portfolio.findOne(query).select('_id').lean();
        if (!existing) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;
    }
};

// Helper: Identifier se query object banane ke liye (_id ya slug)
const buildIdentifierQuery = (identifier) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    return isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };
};

// ============================================================================
// PUBLIC SERVICE FUNCTIONS
// ============================================================================

const getAllActiveProjects = async (category) => {
    const filter = { isActive: true };
    if (category && category !== 'All') {
        filter.category = category;
    }
    return await Portfolio.find(filter)
        .select('-__v')
        .sort({ order: 1, createdAt: -1 });
};

const getPublicProjectBySlug = async (slug) => {
    const project = await Portfolio.findOne({
        slug: slug.toLowerCase(),
        isActive: true
    }).select('-__v');

    if (!project) {
        throw ApiError(404, 'Portfolio project not found');
    }

    return project;
};

// ============================================================================
// ADMIN SERVICE FUNCTIONS
// ============================================================================

const getAllProjectsForAdmin = async (category) => {
    const filter = {};
    if (category && category !== 'All') {
        filter.category = category;
    }
    return await Portfolio.find(filter)
        .select('-__v')
        .sort({ order: 1, createdAt: -1 });
};

const getAdminProjectByIdentifier = async (identifier) => {
    const query = buildIdentifierQuery(identifier);
    const project = await Portfolio.findOne(query).select('-__v');

    if (!project) {
        throw ApiError(404, 'Portfolio project not found');
    }

    return project;
};

const addProject = async (data, localFilePath) => {
    if (!localFilePath) {
        throw ApiError(400, 'Thumbnail image file is strictly required');
    }

    const slug = await generateUniquePortfolioSlug(data.title);

    const thumbnailUrl = await uploadOnCloudinary(localFilePath);
    if (!thumbnailUrl) {
        throw ApiError(500, 'Failed to upload image to Cloudinary');
    }

    const defaultLighthouse = {
        overall: 95,
        performance: 95,
        accessibility: 95,
        bestPractices: 95,
        seo: 95
    };

    const normalizedUrl = /^https?:\/\//i.test(data.domainUrl)
        ? data.domainUrl
        : `https://${data.domainUrl}`;

    try {
        const project = await Portfolio.create({
            title: data.title,
            slug,
            domainUrl: normalizedUrl,
            category: data.category,
            thumbnail: thumbnailUrl,
            description: data.description,
            lighthouse: data.lighthouse ? { ...defaultLighthouse, ...data.lighthouse } : defaultLighthouse,
            technologies: data.technologies || [],
            isVerified: data.isVerified ?? true,
            coreWebVitalsPassed: data.coreWebVitalsPassed ?? true,
            order: data.order ?? 0,
            isActive: data.isActive ?? true
        });

        return project;
    } catch (error) {
        await deleteFromCloudinary(thumbnailUrl);
        throw error;
    }
};

const updateProjectByIdentifier = async (identifier, updateData, localFilePath) => {
    const query = buildIdentifierQuery(identifier);
    const existingProject = await Portfolio.findOne(query);

    if (!existingProject) {
        removeLocalFile(localFilePath);
        throw ApiError(404, 'Portfolio project not found');
    }

    const payload = { ...updateData };

    // Agar title change hua hai toh naya unique slug generate karein
    if (payload.title && payload.title !== existingProject.title) {
        payload.slug = await generateUniquePortfolioSlug(payload.title, existingProject._id);
    }

    if (payload.domainUrl && !/^https?:\/\//i.test(payload.domainUrl)) {
        payload.domainUrl = `https://${payload.domainUrl}`;
    }

    if (payload.lighthouse) {
        payload.lighthouse = {
            ...existingProject.lighthouse.toObject(),
            ...payload.lighthouse
        };
    }

    let newThumbnailUrl = null;
    if (localFilePath) {
        newThumbnailUrl = await uploadOnCloudinary(localFilePath);
        if (!newThumbnailUrl) {
            throw ApiError(500, 'Failed to upload new image to Cloudinary');
        }
        payload.thumbnail = newThumbnailUrl;
    }

    try {
        const updatedProject = await Portfolio.findByIdAndUpdate(
            existingProject._id,
            { $set: payload },
            { new: true, runValidators: true }
        );

        if (newThumbnailUrl && existingProject.thumbnail) {
            await deleteFromCloudinary(existingProject.thumbnail);
        }

        return updatedProject;
    } catch (error) {
        if (newThumbnailUrl) {
            await deleteFromCloudinary(newThumbnailUrl);
        }
        throw error;
    }
};

const deleteProjectByIdentifier = async (identifier) => {
    const query = buildIdentifierQuery(identifier);
    const existingProject = await Portfolio.findOne(query);

    if (!existingProject) {
        throw ApiError(404, 'Portfolio project not found');
    }

    if (existingProject.thumbnail) {
        await deleteFromCloudinary(existingProject.thumbnail);
    }

    await Portfolio.findByIdAndDelete(existingProject._id);
    return existingProject;
};

module.exports = {
    getAllActiveProjects,
    getPublicProjectBySlug,
    getAllProjectsForAdmin,
    getAdminProjectByIdentifier,
    addProject,
    updateProjectByIdentifier,
    deleteProjectByIdentifier
};