const fs = require('fs');
const csv = require('csv-parser');
const Website = require('../models/website.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { csvWebsiteRowSchema } = require('../validations/website.validation');
const { generateDomainSlug } = require('../utils/slugify');

const MAX_CSV_ROWS = 500;

const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildWebsiteIdentifierQuery = (identifier) => {
    const clean = String(identifier).trim();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(clean);
    return isObjectId ? { _id: clean } : { slug: clean.toLowerCase() };
};

const cleanCsvIssueMessage = (field, rawMessage = '') => {
    if (rawMessage.includes('received undefined') || rawMessage === 'Required') {
        return `${field} is required`;
    }
    if (rawMessage.startsWith('Invalid input: expected')) {
        return `Invalid ${field} format`;
    }
    return rawMessage;
};

const getDomainRegistrationHistory = async (domain) => {
    const previousListings = await Website.find({ domain })
        .select('createdAt price isVerified status')
        .sort({ createdAt: 1 })
        .lean();

    return {
        domain,
        isAlreadyListed: previousListings.length > 0,
        alreadyRegisteredCount: previousListings.length,
        history: previousListings.map((item, index) => ({
            position: index + 1,
            registeredAt: item.createdAt,
            price: item.price,
            isVerified: item.isVerified
        }))
    };
};

const addSingleWebsite = async (sellerId, validatedData) => {
    const { domain } = validatedData;

    const alreadyAddedBySelf = await Website.findOne({ sellerId, domain }).lean();
    if (alreadyAddedBySelf) {
        throw ApiError(409, `You have already registered this domain '${domain}'.`, [
            { field: 'domain', message: `You have already registered this domain '${domain}'.` }
        ]);
    }

    const totalPreviousSellers = await Website.countDocuments({ domain });
    const slug = await generateDomainSlug(Website, domain);

    const newWebsite = await Website.create({
        sellerId,
        domain: validatedData.domain,
        slug,
        country: validatedData.country,
        otherCountriesCount: validatedData.otherCountriesCount ?? 0,
        category: validatedData.category,
        subCategories: validatedData.subCategories,
        language: validatedData.language,

        // Commercial Details
        price: validatedData.price,
        contentWritingPrice: validatedData.contentWritingPrice ?? 0,
        turnaroundDays: validatedData.turnaroundDays,
        maxLinksAllowed: validatedData.maxLinksAllowed ?? 2,
        linkType: validatedData.linkType ?? 'DoFollow',
        samplePostUrl: validatedData.samplePostUrl ?? null,

        mozDA: validatedData.mozDA ?? null,
        ahrefsDR: validatedData.ahrefsDR ?? null,
        semrushAS: validatedData.semrushAS ?? null,
        monthlyTraffic: validatedData.monthlyTraffic ?? null,
        semrushTraffic: validatedData.semrushTraffic ?? null,
        ahrefsTraffic: validatedData.ahrefsTraffic ?? null,
        followedBacklinks: validatedData.followedBacklinks ?? null,
        noFollowedBacklinks: validatedData.noFollowedBacklinks ?? null,
        domainAge: validatedData.domainAge ?? null,
        totalDeals: validatedData.totalDeals ?? 0,

        isVerified: false,
        status: 'PENDING_VERIFICATION'
    });

    return {
        website: newWebsite,
        domainStats: {
            alreadyRegisteredCount: totalPreviousSellers,
            message:
                totalPreviousSellers > 0
                    ? `${totalPreviousSellers} other seller(s) have listed this domain previously.`
                    : 'Congratulations! You are the first seller to register this domain.'
        }
    };
};

const processBulkCsvUpload = async (sellerId, filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        const parsingErrors = [];
        let rowNumber = 1;
        let rowLimitExceeded = false;

        const stream = fs.createReadStream(filePath).pipe(csv());

        stream
            .on('data', (rawRow) => {
                rowNumber++;

                if (rowNumber - 1 > MAX_CSV_ROWS) {
                    rowLimitExceeded = true;
                    stream.destroy();
                    return;
                }

                const mappedInput = {
                    domain: rawRow.domain ?? rawRow.Domain,
                    country: rawRow.country ?? rawRow.Country,
                    otherCountriesCount: rawRow.otherCountriesCount ?? rawRow.OtherCountriesCount,
                    category: rawRow.category ?? rawRow.Category,
                    subCategories: rawRow.subCategories ?? rawRow.SubCategories,
                    price: rawRow.price ?? rawRow.Price,
                    contentWritingPrice: rawRow.contentWritingPrice ?? rawRow.ContentWritingPrice,
                    turnaroundDays: rawRow.turnaroundDays ?? rawRow.TurnaroundDays,
                    maxLinksAllowed: rawRow.maxLinksAllowed ?? rawRow.MaxLinksAllowed,
                    linkType: rawRow.linkType ?? rawRow.LinkType,
                    language: rawRow.language ?? rawRow.Language,
                    mozDA: rawRow.mozDA ?? rawRow.MozDA,
                    ahrefsDR: rawRow.ahrefsDR ?? rawRow.AhrefsDR,
                    semrushAS: rawRow.semrushAS ?? rawRow.SemrushAS,
                    monthlyTraffic: rawRow.monthlyTraffic ?? rawRow.MonthlyTraffic,
                    semrushTraffic: rawRow.semrushTraffic ?? rawRow.SemrushTraffic,
                    ahrefsTraffic: rawRow.ahrefsTraffic ?? rawRow.AhrefsTraffic,
                    followedBacklinks: rawRow.followedBacklinks ?? rawRow.FollowedBacklinks,
                    noFollowedBacklinks: rawRow.noFollowedBacklinks ?? rawRow.NoFollowedBacklinks,
                    domainAge: rawRow.domainAge ?? rawRow.DomainAge,
                    totalDeals: rawRow.totalDeals ?? rawRow.TotalDeals,
                    samplePostUrl: rawRow.samplePostUrl ?? rawRow.SamplePostUrl
                };

                // Skip completely blank rows
                const hasAnyValue = Object.values(mappedInput).some(
                    (val) => val !== undefined && val !== null && String(val).trim() !== ''
                );
                if (!hasAnyValue) return;

                const parsed = csvWebsiteRowSchema.safeParse(mappedInput);
                if (!parsed.success) {
                    const issues = parsed.error.issues || parsed.error.errors || [];
                    const fieldErrors = {};
                    for (const issue of issues) {
                        const field = issue.path[0] || 'row';
                        if (!fieldErrors[field]) {
                            fieldErrors[field] = cleanCsvIssueMessage(field, issue.message);
                        }
                    }

                    parsingErrors.push({
                        row: rowNumber,
                        domain: String(mappedInput.domain || 'N/A').trim(),
                        errors: fieldErrors
                    });
                    return;
                }

                rows.push({
                    _rowNumber: rowNumber,
                    sellerId,
                    ...parsed.data,
                    isVerified: false,
                    status: 'PENDING_VERIFICATION'
                });
            })
            .on('close', () => {
                if (rowLimitExceeded) {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    return reject(
                        ApiError(400, `Maximum ${MAX_CSV_ROWS} rows are allowed per CSV upload.`, [
                            { field: 'file', message: `CSV exceeds maximum limit of ${MAX_CSV_ROWS} rows` }
                        ])
                    );
                }
            })
            .on('end', async () => {
                if (rowLimitExceeded) return;

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                if (rows.length === 0) {
                    return resolve({
                        totalRowsInCsv: rowNumber - 1,
                        successfullyInserted: 0,
                        failedOrSkipped: parsingErrors.length,
                        errors: parsingErrors
                    });
                }

                try {
                    const domainList = rows.map((r) => r.domain);

                    const [alreadyOwned, existingSlugDocs] = await Promise.all([
                        Website.find({
                            sellerId,
                            domain: { $in: domainList }
                        })
                            .select('domain')
                            .lean(),
                        Website.find({
                            domain: { $in: domainList }
                        })
                            .select('slug')
                            .lean()
                    ]);

                    const alreadyOwnedSet = new Set(alreadyOwned.map((w) => w.domain));
                    const validRows = [];
                    const seenInCurrentBatch = new Set();
                    const reservedSlugs = new Set(existingSlugDocs.map((w) => w.slug));

                    for (const row of rows) {
                        const { _rowNumber, ...cleanRowData } = row;

                        if (alreadyOwnedSet.has(cleanRowData.domain)) {
                            parsingErrors.push({
                                row: _rowNumber,
                                domain: cleanRowData.domain,
                                errors: { domain: 'You have already listed this domain previously' }
                            });
                        } else if (seenInCurrentBatch.has(cleanRowData.domain)) {
                            parsingErrors.push({
                                row: _rowNumber,
                                domain: cleanRowData.domain,
                                errors: { domain: 'Duplicate entry inside the same CSV' }
                            });
                        } else {
                            seenInCurrentBatch.add(cleanRowData.domain);
                            cleanRowData.slug = await generateDomainSlug(
                                Website,
                                cleanRowData.domain,
                                reservedSlugs
                            );
                            validRows.push(cleanRowData);
                        }
                    }

                    let insertedCount = 0;
                    if (validRows.length > 0) {
                        const result = await Website.insertMany(validRows, { ordered: false });
                        insertedCount = result.length;
                    }

                    return resolve({
                        totalRowsInCsv: rowNumber - 1,
                        successfullyInserted: insertedCount,
                        failedOrSkipped: parsingErrors.length,
                        errors: parsingErrors
                    });
                } catch (dbErr) {
                    return resolve({
                        totalRowsInCsv: rowNumber - 1,
                        successfullyInserted: dbErr.result?.nInserted || 0,
                        failedOrSkipped: parsingErrors.length + (dbErr.writeErrors?.length || 0),
                        errors: parsingErrors
                    });
                }
            })
            .on('error', (err) => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                return reject(err);
            });
    });
};

const getSellerWebsitesList = async (sellerId, { page = 1, limit = 10, status, category, subCategory, country, search }) => {
    const filter = { sellerId };

    if (status) filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (subCategory && subCategory !== 'All') filter.subCategories = subCategory;
    if (country) filter.country = country;
    if (search) {
        filter.domain = { $regex: escapeRegex(search), $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [websites, total] = await Promise.all([
        Website.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Website.countDocuments(filter)
    ]);

    return {
        websites,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getPublicMarketplaceList = async ({ page = 1, limit = 10, category, subCategory, country, search }) => {
    const activeSellerIds = await User.find({
        role: 'SELLER',
        status: 'ACTIVE',
        isDeleted: { $ne: true }
    }).distinct('_id');

    const filter = {
        sellerId: { $in: activeSellerIds },
        status: 'ACTIVE',
        isVerified: true
    };

    if (category && category !== 'All') filter.category = category;
    if (subCategory && subCategory !== 'All') filter.subCategories = subCategory;
    if (country) filter.country = country;
    if (search) {
        filter.domain = { $regex: escapeRegex(search), $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [websites, total] = await Promise.all([
        Website.find(filter)
            .select('-adminReviewNotes -__v')
            .sort({ totalDeals: -1, ahrefsDR: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Website.countDocuments(filter)
    ]);

    return {
        websites,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getAdminWebsitesList = async ({ page = 1, limit = 10, status, sellerId, category, subCategory, country, search }) => {
    const filter = {};

    if (status) filter.status = status;
    if (sellerId) filter.sellerId = sellerId;
    if (category && category !== 'All') filter.category = category;
    if (subCategory && subCategory !== 'All') filter.subCategories = subCategory;
    if (country) filter.country = country;
    if (search) {
        filter.domain = { $regex: escapeRegex(search), $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [websites, total, statusBreakdown] = await Promise.all([
        Website.find(filter)
            .populate('sellerId', 'name email role socialProfiles status isDeleted')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Website.countDocuments(filter),
        Website.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
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

    return {
        summaryCounts,
        websites,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getAdminWebsiteById = async (identifier) => {
    const website = await Website.findOne(buildWebsiteIdentifierQuery(identifier))
        .populate('sellerId', 'name email role socialProfiles status isDeleted createdAt')
        .lean();

    if (!website) {
        throw ApiError(404, 'Website listing not found');
    }

    return website;
};

const reviewAndVerifyWebsite = async (identifier, reviewData) => {
    const website = await Website.findOne(buildWebsiteIdentifierQuery(identifier));
    if (!website) {
        throw ApiError(404, 'Website listing not found');
    }

    const { status, adminReviewNotes, ...seoMetrics } = reviewData;

    website.status = status;
    if (adminReviewNotes !== undefined) {
        website.adminReviewNotes = adminReviewNotes;
    }

    if (status === 'ACTIVE') {
        website.isVerified = true;
        website.verifiedAt = new Date();
    } else if (status === 'REJECTED' || status === 'PENDING_VERIFICATION' || status === 'SUSPENDED') {
        website.isVerified = false;
    }

    Object.keys(seoMetrics).forEach((key) => {
        if (seoMetrics[key] !== undefined) {
            website[key] = seoMetrics[key];
        }
    });

    await website.save();

    return website;
};

const getPublicWebsiteDetailsById = async (identifier) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    const website = await Website.findOne({
        ...query,
        status: 'ACTIVE',
        isVerified: true
    })
        .select('-adminReviewNotes -__v')
        .populate('sellerId', 'name status isDeleted')
        .lean();

    // Agar website nahi mili ya seller deleted/inactive ho gaya hai
    if (
        !website ||
        !website.sellerId ||
        website.sellerId.isDeleted ||
        website.sellerId.status !== 'ACTIVE'
    ) {
        throw ApiError(404, 'Website not found or currently unavailable');
    }

    // Seller ki sensitive info hata kar clean object return karo
    const { sellerId, ...websiteDetails } = website;

    return {
        ...websiteDetails,
        seller: {
            _id: sellerId._id,
            name: sellerId.name
        }
    };
};

const updateSellerWebsiteById = async (sellerId, identifier, updateData) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    const website = await Website.findOne({
        ...query,
        sellerId
    });

    if (!website) {
        throw ApiError(404, 'Website listing not found');
    }

    if (website.status === 'SUSPENDED') {
        throw ApiError(403, 'Suspended website listings cannot be edited. Please contact support.');
    }

    Object.assign(website, updateData);

    // Sirf REJECTED listing fix hokar update ho tabhi re-verification ke liye bhejo
    // Agar pehle se ACTIVE hai toh ACTIVE + isVerified: true hi rahegi
    if (website.status === 'REJECTED') {
        website.status = 'PENDING_VERIFICATION';
        website.isVerified = false;
        website.verifiedAt = null;
        website.adminReviewNotes = null;
    }

    await website.save();

    return website;
};

const getSellerWebsiteDetailsById = async (sellerId, identifier) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    const website = await Website.findOne({
        ...query,
        sellerId
    })
        .select('-__v')
        .lean();

    if (!website) {
        throw ApiError(404, 'Website listing not found');
    }

    return website;
};

module.exports = {
    getDomainRegistrationHistory,
    addSingleWebsite,
    processBulkCsvUpload,
    getSellerWebsitesList,
    getPublicMarketplaceList,
    getAdminWebsitesList,
    getAdminWebsiteById,
    reviewAndVerifyWebsite,
    getPublicWebsiteDetailsById,
    updateSellerWebsiteById,
    getSellerWebsiteDetailsById
};