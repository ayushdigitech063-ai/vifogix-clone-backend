const Package = require('../models/package.model');
const ApiError = require('../utils/ApiError');
const { USER_ROLES } = require('../constants/roles.constant');
const { generateTitleSlug } = require('../utils/slugify');

const buildIdentifierQuery = (identifier) => {
    const clean = String(identifier).trim();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(clean);
    return isObjectId ? { _id: clean } : { slug: clean.toLowerCase() };
};

// Helper: Clean & validate SEO activities array
const sanitizeActivities = (activities = []) => {
    if (!Array.isArray(activities) || activities.length === 0) {
        throw ApiError(400, 'At least one valid SEO activity is required.');
    }

    const seenNames = new Set();
    const cleaned = [];

    for (const item of activities) {
        const cleanName = String(item.activityName || '').trim();
        if (!cleanName) continue;

        const lowerKey = cleanName.toLowerCase();
        if (seenNames.has(lowerKey)) {
            throw ApiError(
                400,
                `Duplicate SEO activity '${cleanName}' is not allowed in the same package.`
            );
        }
        seenNames.add(lowerKey);

        cleaned.push({
            activityName: cleanName,
            monthlyCount: Number(item.monthlyCount),
            unitAddonPrice: Number(item.unitAddonPrice) || 0,
            isAddonAllowed: item.isAddonAllowed !== undefined ? Boolean(item.isAddonAllowed) : true
        });
    }

    if (cleaned.length === 0) {
        throw ApiError(400, 'At least one valid SEO activity is required.');
    }

    return cleaned;
};

// 1. Create New Package (Package Manager -> PENDING_VERIFICATION, Admin -> ACTIVE)
const createNewPackage = async (user, payload) => {
    const normalizedName = payload.name.toUpperCase().trim();
    const isAdmin = user.role === USER_ROLES.ADMIN;

    const duplicate = await Package.findOne({
        name: normalizedName,
        isDeleted: { $ne: true }
    }).lean();

    if (duplicate) {
        throw ApiError(409, `Package '${normalizedName}' already exists.`);
    }

    payload.activities = sanitizeActivities(payload.activities);

    if (payload.isCustomPrice) {
        payload.price = null;
        payload.billingCycle = null;
    } else if (payload.price === null || payload.price === undefined) {
        throw ApiError(400, 'Price is required when isCustomPrice is false.');
    }

    // Both Admin & Package Manager can set 'Most popular' (only 1 package stays highlighted)
    if (payload.isPopular) {
        await Package.updateMany(
            { isPopular: true, isDeleted: { $ne: true } },
            { $set: { isPopular: false, badgeText: null } }
        );
        if (!payload.badgeText) {
            payload.badgeText = 'Most popular';
        }
    } else {
        payload.isPopular = false;
        payload.badgeText = payload.badgeText || null;
    }

    // Display order calculation & shifting across all non-deleted packages
    const totalCount = await Package.countDocuments({ isDeleted: { $ne: true } });
    if (payload.displayOrder === undefined || payload.displayOrder > totalCount + 1) {
        payload.displayOrder = totalCount + 1;
    } else {
        await Package.updateMany(
            { displayOrder: { $gte: payload.displayOrder }, isDeleted: { $ne: true } },
            { $inc: { displayOrder: 1 } }
        );
    }

    const slug = await generateTitleSlug(Package, normalizedName);

    const newPackage = await Package.create({
        ...payload,
        name: normalizedName,
        slug,
        createdBy: user._id,
        creatorRole: user.role,
        status: isAdmin ? 'ACTIVE' : 'PENDING_VERIFICATION',
        isVerified: isAdmin ? true : false,
        verifiedAt: isAdmin ? new Date() : null
    });

    return newPackage;
};

// 2. Shared (Admin & Package Manager): Get All Packages (All non-deleted packages + summary counts)
const getAllManagedPackagesList = async ({ status, creatorRole } = {}) => {
    const filter = { isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (creatorRole) filter.creatorRole = creatorRole;

    const [packages, statusBreakdown] = await Promise.all([
        Package.find(filter)
            .populate('createdBy', 'name email role status')
            .sort({ displayOrder: 1, createdAt: -1 })
            .select('-__v')
            .lean(),
        Package.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
    ]);

    const summaryCounts = {
        ALL: 0,
        PENDING_VERIFICATION: 0,
        ACTIVE: 0,
        REJECTED: 0,
        SUSPENDED: 0
    };

    for (const item of statusBreakdown) {
        if (summaryCounts[item._id] !== undefined) {
            summaryCounts[item._id] = item.count;
            summaryCounts.ALL += item.count;
        }
    }

    return { summaryCounts, packages };
};

// 3. Shared (Admin & Package Manager): Get Single Package Details by Slug (Includes unitAddonPrice)
const getManagedPackageDetails = async (identifier) => {
    const pkg = await Package.findOne({
        ...buildIdentifierQuery(identifier),
        isDeleted: { $ne: true }
    })
        .populate('createdBy', 'name email role')
        .select('-__v')
        .lean();

    if (!pkg) {
        throw ApiError(404, 'Package not found');
    }

    return pkg;
};


const getPublicPackagesList = async () => {
    return Package.find({
        status: 'ACTIVE',
        isVerified: true,
        isActive: true,
        isDeleted: { $ne: true }
    })
        .sort({ displayOrder: 1, createdAt: -1 })
        .select('-activities.unitAddonPrice -adminReviewNotes -isDeleted -__v -createdAt -updatedAt')
        .lean();
};

// 5. Public: Get Single Verified Package by Slug (Hides unitAddonPrice)
const getPublicPackageDetailsBySlug = async (identifier) => {
    const pkg = await Package.findOne({
        ...buildIdentifierQuery(identifier),
        status: 'ACTIVE',
        isVerified: true,
        isActive: true,
        isDeleted: { $ne: true }
    })
        .select('-activities.unitAddonPrice -adminReviewNotes -isDeleted -__v')
        .lean();

    if (!pkg) {
        throw ApiError(404, 'Package not found or currently unavailable');
    }

    return pkg;
};

// 6. Public/Buyer: Live Add-On Price Calculation (Plus-Only Lock)
const calculateCustomPackagePrice = async (identifier, customizations = []) => {
    const pkg = await Package.findOne({
        ...buildIdentifierQuery(identifier),
        status: 'ACTIVE',
        isVerified: true,
        isActive: true,
        isDeleted: { $ne: true }
    }).lean();

    if (!pkg) {
        throw ApiError(404, 'Package not found or currently unavailable');
    }

    if (pkg.isCustomPrice || pkg.price === null) {
        throw ApiError(400, 'This is a custom-priced package. Please contact support for a quote.');
    }

    let extraAddonCost = 0;
    let finalTotalLinks = 0;
    const breakdown = [];

    for (const baseAct of pkg.activities) {
        const customItem = customizations.find(
            (c) => String(c.activityId) === String(baseAct._id)
        );

        const selectedCount = customItem ? Number(customItem.selectedCount) : baseAct.monthlyCount;

        // Strictly prevent decreasing quantity below base package quantity (e.g. 20 -> 19 blocked)
        if (selectedCount < baseAct.monthlyCount) {
            throw ApiError(
                400,
                `'${baseAct.activityName}' cannot be less than base quantity (${baseAct.monthlyCount}).`
            );
        }

        const extraQty = selectedCount - baseAct.monthlyCount;

        if (extraQty > 0 && !baseAct.isAddonAllowed) {
            throw ApiError(400, `Add-on quantity is not allowed for '${baseAct.activityName}'.`);
        }

        extraAddonCost += extraQty * (Number(baseAct.unitAddonPrice) || 0);
        finalTotalLinks += selectedCount;

        breakdown.push({
            activityId: baseAct._id,
            activityName: baseAct.activityName,
            baseCount: baseAct.monthlyCount,
            selectedCount,
            extraQty
        });
    }

    return {
        packageId: pkg._id,
        slug: pkg.slug,
        name: pkg.name,
        basePrice: pkg.price,
        extraAddonCost,
        finalPrice: pkg.price + extraAddonCost,
        baseTotalLinks: pkg.totalLinks,
        finalTotalLinks,
        activities: breakdown
    };
};

// 7. Shared (Admin & Package Manager): Update Any Package by Slug
const updatePackageBySlug = async (user, identifier, updateData) => {
    const isAdmin = user.role === USER_ROLES.ADMIN;

    const pkg = await Package.findOne({
        ...buildIdentifierQuery(identifier),
        isDeleted: { $ne: true }
    });

    if (!pkg) {
        throw ApiError(404, 'Package not found');
    }

    if (!isAdmin && pkg.status === 'SUSPENDED') {
        throw ApiError(403, 'Suspended packages cannot be edited. Please contact Admin.');
    }

    if (updateData.name) {
        const normalizedName = updateData.name.toUpperCase().trim();
        const duplicate = await Package.findOne({
            name: normalizedName,
            _id: { $ne: pkg._id },
            isDeleted: { $ne: true }
        }).lean();

        if (duplicate) {
            throw ApiError(409, `Another package with name '${normalizedName}' already exists.`);
        }
        updateData.name = normalizedName;
    }

    if (updateData.activities) {
        updateData.activities = sanitizeActivities(updateData.activities);
    }

    // Custom vs Fixed Price Edge Cases
    const effectiveIsCustom =
        updateData.isCustomPrice !== undefined ? updateData.isCustomPrice : pkg.isCustomPrice;

    if (effectiveIsCustom) {
        updateData.price = null;
        updateData.billingCycle = null;
    } else {
        const finalPrice = updateData.price !== undefined ? updateData.price : pkg.price;
        if (finalPrice === null || finalPrice === undefined) {
            throw ApiError(400, 'Price is required for non-custom packages.');
        }
        if (!updateData.billingCycle && !pkg.billingCycle) {
            updateData.billingCycle = '/mo';
        }
    }

    // Popular Badge Edge Cases (Shared: Admin & Package Manager)
    if (updateData.isPopular === true) {
        await Package.updateMany(
            { _id: { $ne: pkg._id }, isPopular: true, isDeleted: { $ne: true } },
            { $set: { isPopular: false, badgeText: null } }
        );
        if (!updateData.badgeText && !pkg.badgeText) {
            updateData.badgeText = 'Most popular';
        }
    } else if (updateData.isPopular === false) {
        updateData.badgeText = null;
    }

    // Automatic Display Order Shift Logic (Across all non-deleted packages)
    if (updateData.displayOrder !== undefined && updateData.displayOrder !== pkg.displayOrder) {
        const totalCount = await Package.countDocuments({ isDeleted: { $ne: true } });
        const targetOrder = Math.max(1, Math.min(updateData.displayOrder, totalCount));
        const oldOrder = pkg.displayOrder;

        if (targetOrder < oldOrder) {
            await Package.updateMany(
                {
                    _id: { $ne: pkg._id },
                    displayOrder: { $gte: targetOrder, $lt: oldOrder },
                    isDeleted: { $ne: true }
                },
                { $inc: { displayOrder: 1 } }
            );
        } else if (targetOrder > oldOrder) {
            await Package.updateMany(
                {
                    _id: { $ne: pkg._id },
                    displayOrder: { $gt: oldOrder, $lte: targetOrder },
                    isDeleted: { $ne: true }
                },
                { $inc: { displayOrder: -1 } }
            );
        }

        updateData.displayOrder = targetOrder;
    }

    Object.assign(pkg, updateData);

    // If a REJECTED package is updated by Package Manager, resubmit for Admin verification
    if (!isAdmin && pkg.status === 'REJECTED') {
        pkg.status = 'PENDING_VERIFICATION';
        pkg.isVerified = false;
        pkg.verifiedAt = null;
        pkg.adminReviewNotes = null;
    }

    await pkg.save();

    return pkg;
};

// 8. Shared (Admin & Package Manager): Soft Delete Any Package by Slug
const deletePackageBySlug = async (identifier) => {
    const pkg = await Package.findOne({
        ...buildIdentifierQuery(identifier),
        isDeleted: { $ne: true }
    });

    if (!pkg) {
        throw ApiError(404, 'Package not found');
    }

    const oldOrder = pkg.displayOrder;
    pkg.isDeleted = true;
    pkg.isActive = false;
    pkg.isPopular = false;
    pkg.badgeText = null;
    await pkg.save();

    // Shift displayOrder up for all remaining non-deleted packages
    await Package.updateMany(
        { displayOrder: { $gt: oldOrder }, isDeleted: { $ne: true } },
        { $inc: { displayOrder: -1 } }
    );

    return {
        deletedPackageId: pkg._id,
        slug: pkg.slug,
        name: pkg.name
    };
};

// 9. Shared (Admin & Package Manager): Toggle Active Status by Slug
const updatePackageStatusBySlug = async (identifier, isActive) => {
    const pkg = await Package.findOne({
        ...buildIdentifierQuery(identifier),
        isDeleted: { $ne: true }
    });

    if (!pkg) {
        throw ApiError(404, 'Package not found');
    }

    pkg.isActive = isActive;

    if (!isActive && pkg.isPopular) {
        pkg.isPopular = false;
        pkg.badgeText = null;
    }

    await pkg.save();
    return pkg;
};

// 10. Admin Only: Verify / Approve / Reject / Suspend Package by Slug
const reviewPackageBySlug = async (identifier, { status, adminReviewNotes }) => {
    const pkg = await Package.findOne({
        ...buildIdentifierQuery(identifier),
        isDeleted: { $ne: true }
    });

    if (!pkg) {
        throw ApiError(404, 'Package not found');
    }

    pkg.status = status;
    if (adminReviewNotes !== undefined) {
        pkg.adminReviewNotes = adminReviewNotes;
    }

    if (status === 'ACTIVE') {
        pkg.isVerified = true;
        pkg.verifiedAt = new Date();
        pkg.isActive = true;
    } else if (status === 'REJECTED' || status === 'PENDING_VERIFICATION' || status === 'SUSPENDED') {
        pkg.isVerified = false;
        pkg.isActive = false;
    }

    await pkg.save();
    return pkg;
};

module.exports = {
    createNewPackage,
    getAllManagedPackagesList,
    getManagedPackageDetails,
    getPublicPackagesList,
    getPublicPackageDetailsBySlug,
    calculateCustomPackagePrice,
    updatePackageBySlug,
    deletePackageBySlug,
    updatePackageStatusBySlug,
    reviewPackageBySlug
};