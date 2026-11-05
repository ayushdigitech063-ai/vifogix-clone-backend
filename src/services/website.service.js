const fs = require('fs');
const csv = require('csv-parser');
const Website = require('../models/website.model');
const ApiError = require('../utils/ApiError');

// 1. Strict Domain Sanitizer (XSS, IP, Port, aur URL formatting handle karega)
const validateAndFormatDomain = (rawDomain) => {
    if (!rawDomain || typeof rawDomain !== 'string') return null;

    let input = rawDomain.trim().toLowerCase();

    // XSS / Malicious HTML tag check
    if (/<[^>]*>/g.test(input)) return null;

    // Direct IP addresses (IPv4) aur port numbers block
    if (/^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/i.test(input) || /:\d{2,5}/.test(input)) {
        return null;
    }

    // Standard valid domain regex check
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(input)) {
        return null;
    }

    // Clean base domain extraction
    return input
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .split('?')[0]
        .trim();
};

// 2. Pre-Check: Check how many sellers listed this domain earlier
const getDomainRegistrationHistory = async (rawDomain) => {
    const domain = validateAndFormatDomain(rawDomain);
    if (!domain) {
        throw ApiError(400, 'Invalid domain format provided');
    }

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

// 3. Single Website Add
const addSingleWebsite = async (sellerId, data) => {
    const domain = validateAndFormatDomain(data.domain);
    if (!domain) {
        throw ApiError(400, 'Invalid domain format or malicious URL');
    }

    if (!data.country || !data.country.trim()) {
        throw ApiError(400, 'Country field is strictly required');
    }

    // Price limit check ($5 to $20,000)
    if (data.price < 5 || data.price > 20000) {
        throw ApiError(400, 'Price must be between $5 and $20,000');
    }

    // Turnaround Days check (1 to 30 days)
    if (data.turnaroundDays && (data.turnaroundDays < 1 || data.turnaroundDays > 30)) {
        throw ApiError(400, 'Turnaround days must be between 1 and 30 days');
    }

    // Check duplicate listing by the same seller
    const alreadyAddedBySelf = await Website.findOne({ sellerId, domain });
    if (alreadyAddedBySelf) {
        throw ApiError(409, `Aapne domain '${domain}' pehle se register kiya hua hai.`);
    }

    // Count how many other sellers have listed this domain
    const totalPreviousSellers = await Website.countDocuments({ domain });

    const newWebsite = await Website.create({
        ...data,
        domain,
        sellerId,
        country: data.country.trim(),
        category: data.category && data.category.trim() ? data.category.trim() : 'All',
        isVerified: false,
        status: 'PENDING_VERIFICATION'
    });

    return {
        website: newWebsite,
        domainStats: {
            alreadyRegisteredCount: totalPreviousSellers,
            message: totalPreviousSellers > 0
                ? `${totalPreviousSellers} other seller(s) have listed this domain previously.`
                : 'Congratulations! You are the first seller to register this domain.'
        }
    };
};

// 4. Bulk CSV 1000+ Upload with Industry Edge Cases & Fail-safes
const processBulkCsvUpload = async (sellerId, filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        const parsingErrors = [];
        let rowNumber = 1;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                rowNumber++;

                // Empty row check (Excel trailing commas filter: ",,,,")
                const rawDomain = (data.domain || data.Domain || '').trim();
                const rawPriceStr = data.price || data.Price;
                const rawCountryStr = data.country || data.Country;

                if (!rawDomain && !rawPriceStr && !rawCountryStr) {
                    return; // Silent skip for completely empty trailing lines
                }

                // Rule 1: Strict Domain Validation
                const cleanDomain = validateAndFormatDomain(rawDomain);
                if (!cleanDomain) {
                    parsingErrors.push({
                        row: rowNumber,
                        domain: rawDomain || 'N/A',
                        reason: 'Invalid domain format / Malicious character detected'
                    });
                    return;
                }

                // Rule 2: Commercial Pricing Boundary ($5 to $20,000)
                const rawPrice = Number(rawPriceStr);
                if (isNaN(rawPrice) || rawPrice < 5 || rawPrice > 20000) {
                    parsingErrors.push({
                        row: rowNumber,
                        domain: cleanDomain,
                        reason: 'Price must be a valid number between $5 and $20,000'
                    });
                    return;
                }

                // Rule 3: Turnaround Days Boundary (1 to 30 days)
                const tat = Number(data.turnaroundDays || data.TurnaroundDays) || 3;
                if (tat < 1 || tat > 30) {
                    parsingErrors.push({
                        row: rowNumber,
                        domain: cleanDomain,
                        reason: 'Turnaround days must be between 1 and 30 days'
                    });
                    return;
                }

                // Rule 4: Mandatory Country Check
                const country = (rawCountryStr || '').trim();
                if (!country) {
                    parsingErrors.push({
                        row: rowNumber,
                        domain: cleanDomain,
                        reason: 'Country is mandatory and missing in this row'
                    });
                    return;
                }

                // Rule 5: SEO Metrics Limits (Moz DA & Ahrefs DR: 0 to 100)
                let mozDA = data.mozDA && !isNaN(Number(data.mozDA)) ? Number(data.mozDA) : null;
                let ahrefsDR = data.ahrefsDR && !isNaN(Number(data.ahrefsDR)) ? Number(data.ahrefsDR) : null;

                if (mozDA !== null && (mozDA < 0 || mozDA > 100)) {
                    parsingErrors.push({
                        row: rowNumber,
                        domain: cleanDomain,
                        reason: 'Moz DA must be an integer between 0 and 100'
                    });
                    return;
                }

                if (ahrefsDR !== null && (ahrefsDR < 0 || ahrefsDR > 100)) {
                    parsingErrors.push({
                        row: rowNumber,
                        domain: cleanDomain,
                        reason: 'Ahrefs DR must be an integer between 0 and 100'
                    });
                    return;
                }

                // Rule 6: Category Fallback to 'All'
                let category = (data.category || data.Category || '').trim();
                if (!category) category = 'All';

                rows.push({
                    sellerId,
                    domain: cleanDomain,
                    country,
                    category,
                    price: rawPrice,
                    turnaroundDays: tat,
                    language: (data.language || data.Language || 'English').trim(),
                    mozDA,
                    ahrefsDR,
                    semrushAS: data.semrushAS && !isNaN(Number(data.semrushAS)) ? Number(data.semrushAS) : null,
                    monthlyTraffic: data.monthlyTraffic ? String(data.monthlyTraffic).trim() : null,
                    domainAge: data.domainAge ? String(data.domainAge).trim() : null,
                    samplePostUrl: (data.samplePostUrl || data.SamplePostUrl || '').trim() || null,
                    isVerified: false,
                    status: 'PENDING_VERIFICATION'
                });
            })
            .on('end', async () => {
                // Temp file turant remove karein
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
                    // Check duplicate domains already owned by this seller
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
                                reason: 'You have already listed this domain previously'
                            });
                        } else if (seenInCurrentBatch.has(row.domain)) {
                            parsingErrors.push({
                                domain: row.domain,
                                reason: 'Duplicate entry inside the same CSV'
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

// 5. Seller Listings with Filters & Pagination
const getSellerWebsitesList = async (sellerId, { page = 1, limit = 10, status, category, country, search }) => {
    const filter = { sellerId };

    if (status) filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (country) filter.country = country;
    if (search) {
        filter.domain = { $regex: search.trim().toLowerCase(), $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [websites, total] = await Promise.all([
        Website.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        Website.countDocuments(filter)
    ]);

    return {
        websites,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

module.exports = {
    getDomainRegistrationHistory,
    addSingleWebsite,
    processBulkCsvUpload,
    getSellerWebsitesList
};