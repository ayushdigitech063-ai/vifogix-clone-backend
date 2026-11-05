const Portfolio = require('../models/portfolio.model');
const ApiError = require('../utils/ApiError');

const getAllActiveProjects = async (category) => {
    const filter = { isActive: true };
    if (category && category !== 'All') {
        filter.category = category;
    }
    return await Portfolio.find(filter).sort({ order: 1, createdAt: -1 });
};

const getProjectById = async (projectId) => {
    const project = await Portfolio.findById(projectId);
    if (!project) {
        throw ApiError(404, 'Portfolio project not found');
    }
    return project;
};

const addProject = async (data) => {
    return await Portfolio.create(data);
};

const updateProjectById = async (projectId, updateData) => {
    const project = await Portfolio.findByIdAndUpdate(
        projectId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
    if (!project) {
        throw ApiError(404, 'Portfolio project not found');
    }
    return project;
};

const deleteProjectById = async (projectId) => {
    const project = await Portfolio.findByIdAndDelete(projectId);
    if (!project) {
        throw ApiError(404, 'Portfolio project not found');
    }
    return project;
};

module.exports = {
    getAllActiveProjects,
    getProjectById,
    addProject,
    updateProjectById,
    deleteProjectById
};