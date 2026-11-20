const PressRelease = require('../models/pressRelease.model');
const ApiError = require('../utils/ApiError');

// Helper: Clean & deduplicate string arrays
const cleanStringArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return [...new Set(arr.map((item) => item.trim()).filter(Boolean))];
};

// ==========================================
// ZONE 1: SELLER SERVICES
// ==========================================

// 1. Seller: Create New Press Release Package
const createSellerPressRelease = async (sellerId, payload) => {
    if (payload.outletDomain) {
        const normalizedDomain = payload.outletDomain.toLowerCase().trim();
        const duplicate = await PressRelease.findOne({
            sellerId,
            outletDomain: normalizedDomain,
            isDeleted: false
        }).lean();

        if (duplicate) {
            throw ApiError(409, `You have already added '${normalizedDomain}' in your press releases.`);
        }
        payload.outletDomain = normalizedDomain;
    }

    payload.subCategories = cleanStringArray(payload.subCategories);
    payload.included = cleanStringArray(payload.included);
    payload.excluded = cleanStringArray(payload.excluded);

    if (!payload.isPrWritingAvailable) {
        payload.prWritingPrice = 0;
    } else if (!payload.prWritingPrice || payload.prWritingPrice <= 0) {
        throw ApiError(400, 'PR writing price must be greater than 0 when PR writing is enabled.');
    }

    const newPr = await PressRelease.create({
        ...payload,
        sellerId,
        isVerified: false,
        status: 'PENDING_VERIFICATION',
        isDeleted: false,
        deletedAt: null
    });

    return newPr;
};

// 2. Seller: Get My Press Releases List
const getSellerPressReleasesList = async (sellerId, query = {}) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { sellerId, isDeleted: false };

    if (query.status) filter.status = query.status.toUpperCase();
    if (query.category) filter.category = query.category;
    if (query.subCategory) filter.subCategories = query.subCategory;
    if (query.search) {
        const regex = new RegExp(query.search.trim(), 'i');
        filter.$or = [{ title: regex }, { outletDomain: regex }];
    }

    const [pressReleases, total] = await Promise.all([
        PressRelease.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v'),
        PressRelease.countDocuments(filter)
    ]);

    return {
        pressReleases,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// 3. Seller: Get Single Press Release by ID
const getSellerPressReleaseDetailsById = async (sellerId, prId) => {
    const pr = await PressRelease.findOne({
        _id: prId,
        sellerId,
        isDeleted: false
    }).select('-__v');

    if (!pr) {
        throw ApiError(404, 'Press release package not found');
    }

    return pr;
};

// 4. Seller: Update Press Release by ID
const updateSellerPressReleaseById = async (sellerId, prId, updateData) => {
    const pr = await PressRelease.findOne({
        _id: prId,
        sellerId,
        isDeleted: false
    });

    if (!pr) {
        throw ApiError(404, 'Press release package not found');
    }

    if (updateData.outletDomain) {
        const normalizedDomain = updateData.outletDomain.toLowerCase().trim();
        const duplicate = await PressRelease.findOne({
            sellerId,
            outletDomain: normalizedDomain,
            isDeleted: false,
            _id: { $ne: prId }
        }).lean();

        if (duplicate) {
            throw ApiError(409, `You have already added '${normalizedDomain}' in your press releases.`);
        }
        updateData.outletDomain = normalizedDomain;
    }

    if (updateData.subCategories) updateData.subCategories = cleanStringArray(updateData.subCategories);
    if (updateData.included) updateData.included = cleanStringArray(updateData.included);
    if (updateData.excluded) updateData.excluded = cleanStringArray(updateData.excluded);

    const effectiveWritingAvailable =
        updateData.isPrWritingAvailable !== undefined
            ? updateData.isPrWritingAvailable
            : pr.isPrWritingAvailable;

    if (!effectiveWritingAvailable) {
        updateData.prWritingPrice = 0;
    } else {
        const finalWritingPrice =
            updateData.prWritingPrice !== undefined ? updateData.prWritingPrice : pr.prWritingPrice;

        if (!finalWritingPrice || finalWritingPrice <= 0) {
            throw ApiError(
                400,
                'PR writing price must be greater than 0 when PR writing is enabled.'
            );
        }
    }

    Object.assign(pr, updateData);

    pr.status = 'PENDING_VERIFICATION';
    pr.isVerified = false;
    pr.verifiedAt = null;
    pr.adminReviewNotes = null;

    await pr.save();
    return pr;
};

// 5. Seller: Soft Delete Press Release by ID
const deleteSellerPressReleaseById = async (sellerId, prId) => {
    const deleted = await PressRelease.findOneAndUpdate(
        { _id: prId, sellerId, isDeleted: false },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                isVerified: false,
                status: 'SUSPENDED'
            }
        },
        { new: true }
    );

    if (!deleted) {
        throw ApiError(404, 'Press release package not found');
    }

    return {
        deletedPressReleaseId: prId,
        title: deleted.title,
        deletedAt: deleted.deletedAt
    };
};

// ==========================================
// ZONE 2: ADMIN SERVICES
// ==========================================

// 6. Admin: Get All Sellers' Press Releases (With Seller Info, Filters & Pagination)
const getAdminPressReleasesList = async (query = {}) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // By default soft-deleted hide rahenge, jab tak ?includeDeleted=true na bheja jaye
    const filter = {};
    if (query.includeDeleted !== 'true') {
        filter.isDeleted = false;
    }

    if (query.status) filter.status = query.status.toUpperCase();
    if (query.category) filter.category = query.category;
    if (query.sellerId) filter.sellerId = query.sellerId;
    if (query.search) {
        const regex = new RegExp(query.search.trim(), 'i');
        filter.$or = [{ title: regex }, { outletDomain: regex }];
    }

    const [pressReleases, total] = await Promise.all([
        PressRelease.find(filter)
            .populate('sellerId', 'name email phone companyName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v'),
        PressRelease.countDocuments(filter)
    ]);

    return {
        pressReleases,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// 7. Admin: Get Single Press Release Details by ID (For Review Modal/Page)
const getAdminPressReleaseDetailsById = async (prId) => {
    const pr = await PressRelease.findById(prId)
        .populate('sellerId', 'name email phone companyName')
        .select('-__v');

    if (!pr) {
        throw ApiError(404, 'Press release package not found');
    }

    return pr;
};

// 8. Admin: Verify / Approve / Reject / Suspend Press Release
const updatePressReleaseStatusByAdmin = async (prId, { status, adminReviewNotes }) => {
    const pr = await PressRelease.findOne({ _id: prId, isDeleted: false });
    if (!pr) {
        throw ApiError(404, 'Press release package not found or has been deleted by seller');
    }

    pr.status = status;

    if (status === 'ACTIVE') {
        pr.isVerified = true;
        pr.verifiedAt = new Date();
        pr.adminReviewNotes = adminReviewNotes || null;
    } else {
        // REJECTED ya SUSPENDED
        pr.isVerified = false;
        pr.verifiedAt = null;
        pr.adminReviewNotes = adminReviewNotes;
    }

    await pr.save();
    return pr;
};

// ==========================================
// ZONE 3: PUBLIC / BUYER SERVICES
// ==========================================

// 9. Public: Get Active & Verified Press Releases Marketplace List
const getPublicPressReleasesList = async (query = {}) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const filter = {
        status: 'ACTIVE',
        isVerified: true,
        isDeleted: false
    };

    if (query.category) filter.category = query.category;
    if (query.subCategory) filter.subCategories = query.subCategory;
    if (query.country) filter.country = new RegExp(`^${query.country.trim()}$`, 'i');
    if (query.linkType) filter.linkType = query.linkType;

    if (query.isPrWritingAvailable === 'true') {
        filter.isPrWritingAvailable = true;
    }

    // Price Range Filter
    if (query.minPrice || query.maxPrice) {
        filter.price = {};
        if (query.minPrice) filter.price.$gte = Number(query.minPrice);
        if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    // DA / DR Filters
    if (query.minDA) filter.mozDA = { $gte: Number(query.minDA) };
    if (query.minDR) filter.ahrefsDR = { $gte: Number(query.minDR) };

    if (query.search) {
        const regex = new RegExp(query.search.trim(), 'i');
        filter.$or = [{ title: regex }, { outletDomain: regex }, { packageDescription: regex }];
    }

    // Sorting Options
    let sortOption = { createdAt: -1 };
    if (query.sortBy === 'price_asc') sortOption = { price: 1 };
    else if (query.sortBy === 'price_desc') sortOption = { price: -1 };
    else if (query.sortBy === 'da_desc') sortOption = { mozDA: -1 };
    else if (query.sortBy === 'dr_desc') sortOption = { ahrefsDR: -1 };

    const [pressReleases, total] = await Promise.all([
        PressRelease.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .select('-adminReviewNotes -isDeleted -deletedAt -__v'),
        PressRelease.countDocuments(filter)
    ]);

    return {
        pressReleases,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// 10. Public: Get Single Active Press Release Detail Page by ID
const getPublicPressReleaseDetailsById = async (prId) => {
    const pr = await PressRelease.findOne({
        _id: prId,
        status: 'ACTIVE',
        isVerified: true,
        isDeleted: false
    }).select('-adminReviewNotes -isDeleted -deletedAt -__v');

    if (!pr) {
        throw ApiError(404, 'Press release package not found');
    }

    return pr;
};

module.exports = {
    // Seller
    createSellerPressRelease,
    getSellerPressReleasesList,
    getSellerPressReleaseDetailsById,
    updateSellerPressReleaseById,
    deleteSellerPressReleaseById,
    // Admin
    getAdminPressReleasesList,
    getAdminPressReleaseDetailsById,
    updatePressReleaseStatusByAdmin,
    // Public
    getPublicPressReleasesList,
    getPublicPressReleaseDetailsById
};