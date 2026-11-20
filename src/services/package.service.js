const Package = require('../models/package.model');
const ApiError = require('../utils/ApiError');


const sanitizeFeatures = (features = []) => {
    const cleaned = [...new Set(features.map((f) => f.trim()).filter(Boolean))];
    if (cleaned.length === 0) {
        throw ApiError(400, 'At least one valid feature is required.');
    }
    return cleaned;
};


const createNewPackage = async (payload) => {
    const normalizedName = payload.name.toUpperCase().trim();

    const exists = await Package.findOne({ name: normalizedName }).lean();
    if (exists) {
        throw ApiError(409, `Package '${normalizedName}' already exists.`);
    }

    payload.features = sanitizeFeatures(payload.features);

    if (payload.isCustomPrice) {
        payload.price = null;
        payload.billingCycle = null;
    } else if (payload.price === null || payload.price === undefined) {
        throw ApiError(400, 'Price is required when isCustomPrice is false.');
    }

    // Sirf 1 card hi 'Most popular' highlighted rahega
    if (payload.isPopular) {
        await Package.updateMany(
            { isPopular: true },
            { $set: { isPopular: false, badgeText: null } }
        );
        if (!payload.badgeText) {
            payload.badgeText = 'Most popular';
        }
    } else {
        payload.badgeText = null;
    }

    // Display order calculation & shifting (saare validations pass hone ke baad)
    const totalCount = await Package.countDocuments();
    if (payload.displayOrder === undefined || payload.displayOrder > totalCount + 1) {
        payload.displayOrder = totalCount + 1;
    } else {
        await Package.updateMany(
            { displayOrder: { $gte: payload.displayOrder } },
            { $inc: { displayOrder: 1 } }
        );
    }

    const newPackage = await Package.create({
        ...payload,
        name: normalizedName
    });

    return newPackage;
};

// 2. Admin: Get All Packages (Active + Inactive dono)
const getAdminPackagesList = async () => {
    return Package.find({})
        .sort({ displayOrder: 1, updatedAt: -1 })
        .select('-__v')
        .lean();
};

// 3. Public: Get Only Active Packages (Frontend Pricing Section ke liye)
const getPublicPackagesList = async () => {
    return Package.find({ isActive: true })
        .sort({ displayOrder: 1, updatedAt: -1 })
        .select('-__v -createdAt -updatedAt')
        .lean();
};

// 4. Admin: Update Package by ID
const updatePackageById = async (packageId, updateData) => {
    const pkg = await Package.findById(packageId);
    if (!pkg) {
        throw ApiError(404, 'Package not found');
    }

    if (updateData.name) {
        const normalizedName = updateData.name.toUpperCase().trim();
        const duplicate = await Package.findOne({
            name: normalizedName,
            _id: { $ne: packageId }
        }).lean();

        if (duplicate) {
            throw ApiError(409, `Another package with name '${normalizedName}' already exists.`);
        }
        updateData.name = normalizedName;
    }

    if (updateData.features) {
        updateData.features = sanitizeFeatures(updateData.features);
    }

    // Custom vs Fixed Price Edge Cases (Combined state check)
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

    // Popular Badge Edge Cases
    if (updateData.isPopular === true) {
        await Package.updateMany(
            { _id: { $ne: packageId }, isPopular: true },
            { $set: { isPopular: false, badgeText: null } }
        );
        if (!updateData.badgeText && !pkg.badgeText) {
            updateData.badgeText = 'Most popular';
        }
    } else if (updateData.isPopular === false) {
        updateData.badgeText = null;
    }

    // Automatic Display Order Shift Logic
    if (updateData.displayOrder !== undefined && updateData.displayOrder !== pkg.displayOrder) {
        const totalCount = await Package.countDocuments();
        const targetOrder = Math.max(1, Math.min(updateData.displayOrder, totalCount));
        const oldOrder = pkg.displayOrder;

        if (targetOrder < oldOrder) {
            await Package.updateMany(
                {
                    _id: { $ne: packageId },
                    displayOrder: { $gte: targetOrder, $lt: oldOrder }
                },
                { $inc: { displayOrder: 1 } }
            );
        } else if (targetOrder > oldOrder) {
            await Package.updateMany(
                {
                    _id: { $ne: packageId },
                    displayOrder: { $gt: oldOrder, $lte: targetOrder }
                },
                { $inc: { displayOrder: -1 } }
            );
        }

        updateData.displayOrder = targetOrder;
    }

    Object.assign(pkg, updateData);
    await pkg.save();

    return pkg;
};

// 5. Admin: Delete Package by ID
const deletePackageById = async (packageId) => {
    const deleted = await Package.findByIdAndDelete(packageId);
    if (!deleted) {
        throw ApiError(404, 'Package not found');
    }

    await Package.updateMany(
        { displayOrder: { $gt: deleted.displayOrder } },
        { $inc: { displayOrder: -1 } }
    );

    return { deletedPackageId: packageId, name: deleted.name };
};

module.exports = {
    createNewPackage,
    getAdminPackagesList,
    getPublicPackagesList,
    updatePackageById,
    deletePackageById
};