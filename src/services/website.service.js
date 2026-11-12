const fs = require('fs');
const csv = require('csv-parser');
const Website = require('../models/website.model');
const ApiError = require('../utils/ApiError');
const { csvWebsiteRowSchema } = require('../validations/website.validation');

// 1. Pre-Check: Domain already sanitized by Zod middleware
const getDomainRegistrationHistory = async (domain) => {
    const previousListings = await Website.find({ domain })
        .select('createdAt price isVerified status')
        .sort({ createdAt: 1 });

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

// 2. Single Website Add (All inputs already validated & sanitized by addWebsiteSchema)
const addSingleWebsite = async (sellerId, validatedData) => {
    const { domain } = validatedData;

    // Business Rule: Duplicate listing check for the same seller
    const alreadyAddedBySelf = await Website.findOne({ sellerId, domain });
    if (alreadyAddedBySelf) {
        throw ApiError(409, `You have already registered this domain '${domain}'.`);
    }

    const totalPreviousSellers = await Website.countDocuments({ domain });

    const newWebsite = await Website.create({
        sellerId,
        domain: validatedData.domain,
        country: validatedData.country,
        category: validatedData.category,
        price: validatedData.price,
        contentWritingPrice: validatedData.contentWritingPrice,
        turnaroundDays: validatedData.turnaroundDays,
        maxLinksAllowed: validatedData.maxLinksAllowed,
        linkType: validatedData.linkType,
        language: validatedData.language,
        samplePostUrl: validatedData.samplePostUrl,
        mozDA: validatedData.mozDA,
        ahrefsDR: validatedData.ahrefsDR,
        semrushAS: validatedData.semrushAS,
        monthlyTraffic: validatedData.monthlyTraffic,
        domainAge: validatedData.domainAge,
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

// 3. Bulk CSV Upload (Validated via shared csvWebsiteRowSchema)
const processBulkCsvUpload = async (sellerId, filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        const parsingErrors = [];
        let rowNumber = 1;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (rawRow) => {
                rowNumber++;

                const mappedInput = {
                    domain: rawRow.domain ?? rawRow.Domain,
                    country: rawRow.country ?? rawRow.Country,
                    category: rawRow.category ?? rawRow.Category,
                    price: rawRow.price ?? rawRow.Price,
                    turnaroundDays: rawRow.turnaroundDays ?? rawRow.TurnaroundDays,
                    language: rawRow.language ?? rawRow.Language,
                    mozDA: rawRow.mozDA ?? rawRow.MozDA,
                    ahrefsDR: rawRow.ahrefsDR ?? rawRow.AhrefsDR,
                    semrushAS: rawRow.semrushAS ?? rawRow.SemrushAS,
                    monthlyTraffic: rawRow.monthlyTraffic ?? rawRow.MonthlyTraffic,
                    domainAge: rawRow.domainAge ?? rawRow.DomainAge,
                    samplePostUrl: rawRow.samplePostUrl ?? rawRow.SamplePostUrl
                };

                // Skip completely blank rows
                const hasAnyValue = Object.values(mappedInput).some(
                    (val) => val !== undefined && val !== null && String(val).trim() !== ''
                );
                if (!hasAnyValue) return;

                // Validate row using centralized Zod schema
                const parsed = csvWebsiteRowSchema.safeParse(mappedInput);
                if (!parsed.success) {
                    const fieldErrors = {};
                    for (const issue of parsed.error.issues) {
                        const field = issue.path[0] || 'row';
                        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
                    }

                    parsingErrors.push({
                        row: rowNumber,
                        domain: String(mappedInput.domain || 'N/A').trim(),
                        errors: fieldErrors
                    });
                    return;
                }

                rows.push({
                    sellerId,
                    ...parsed.data,
                    isVerified: false,
                    status: 'PENDING_VERIFICATION'
                });
            })
            .on('end', async () => {
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
                    const alreadyOwned = await Website.find({
                        sellerId,
                        domain: { $in: domainList }
                    }).select('domain');

                    const alreadyOwnedSet = new Set(alreadyOwned.map((w) => w.domain));
                    const validRows = [];
                    const seenInCurrentBatch = new Set();

                    for (const row of rows) {
                        if (alreadyOwnedSet.has(row.domain)) {
                            parsingErrors.push({
                                domain: row.domain,
                                errors: { domain: 'You have already listed this domain previously' }
                            });
                        } else if (seenInCurrentBatch.has(row.domain)) {
                            parsingErrors.push({
                                domain: row.domain,
                                errors: { domain: 'Duplicate entry inside the same CSV' }
                            });
                        } else {
                            seenInCurrentBatch.add(row.domain);
                            validRows.push(row);
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

// 4. Seller Listings with Filters & Pagination
const getSellerWebsitesList = async (sellerId, { page, limit, status, category, country, search }) => {
    const filter = { sellerId };

    if (status) filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (country) filter.country = country;
    if (search) {
        filter.domain = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [websites, total] = await Promise.all([
        Website.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

module.exports = {
    getDomainRegistrationHistory,
    addSingleWebsite,
    processBulkCsvUpload,
    getSellerWebsitesList
};