const { z } = require('zod');

// Helper: Domain Sanitizer & Validator (XSS, IP, Port, Protocol & www removal)
const sanitizeAndValidateDomain = (rawDomain) => {
    if (!rawDomain || typeof rawDomain !== 'string') return null;

    const input = rawDomain.trim().toLowerCase();

    // Block XSS / HTML tags
    if (/<[^>]*>/g.test(input)) return null;

    // Block direct IPv4 addresses and port numbers
    if (/^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/i.test(input) || /:\d{2,5}/.test(input)) {
        return null;
    }

    // Standard domain format check (Updated {2,24} to support modern TLDs like .technology, .digital)
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,24})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(input)) return null;

    const cleanDomain = input
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .split('?')[0]
        .trim();

    // Reject pure numeric TLD or underscore
    if (/_/.test(cleanDomain) || /^\d+\.\d+\.\d+\.\d+$/.test(cleanDomain)) {
        return null;
    }

    return cleanDomain;
};

// Reusable Helper: Empty string "" ko automatically null me convert karne ke liye
const optionalNullableString = z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null));

// Reusable Helper: CSV ke numeric optional fields ("" -> null, "94" -> 94)
const csvOptionalMetricScore = (label) =>
    z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? null : Number(val)),
        z
            .number({ error: `${label} must be a valid number`, invalid_type_error: `${label} must be a valid number` })
            .int(`${label} must be an integer`)
            .min(0, `${label} must be between 0 and 100`)
            .max(100, `${label} must be between 0 and 100`)
            .nullable()
    );

// Reusable Domain Zod Schema with Transform
const domainFieldSchema = z
    .string({ error: 'Domain is required', required_error: 'Domain is required' })
    .trim()
    .min(3, 'Domain must be at least 3 characters long')
    .refine((val) => sanitizeAndValidateDomain(val) !== null, {
        message: 'Invalid domain format, IP address, or malicious characters detected'
    })
    .transform((val) => sanitizeAndValidateDomain(val));

// 1. Add Single Website Schema
const addWebsiteSchema = z.object({
    body: z.object({
        domain: domainFieldSchema,
        category: z
            .string()
            .trim()
            .optional()
            .transform((val) => (val && val.length > 0 ? val : 'All')),
        country: z
            .string({ error: 'Country is required', required_error: 'Country is required' })
            .trim()
            .min(2, 'Country name must be at least 2 characters long'),
        // NEW: UI "+4 Others" country count
        otherCountriesCount: z.coerce
            .number({ error: 'Other countries count must be a number' })
            .int()
            .min(0, 'Other countries count cannot be negative')
            .optional()
            .default(0),
        language: z
            .string()
            .trim()
            .optional()
            .transform((val) => (val && val.length > 0 ? val : 'English')),

        // Commercial Details
        price: z.coerce
            .number({
                error: 'Price must be a valid number',
                required_error: 'Price is required',
                invalid_type_error: 'Price must be a valid number'
            })
            .min(5, 'Price must be at least $5')
            .max(20000, 'Price cannot exceed $20,000'),
        contentWritingPrice: z.coerce
            .number({ error: 'Content writing price must be a number', invalid_type_error: 'Content writing price must be a number' })
            .nonnegative('Content writing price cannot be negative')
            .optional()
            .default(0),
        turnaroundDays: z.coerce
            .number({ error: 'Turnaround days must be a number', invalid_type_error: 'Turnaround days must be a number' })
            .int('Turnaround days must be a whole number')
            .min(1, 'Turnaround days must be at least 1 day')
            .max(30, 'Turnaround days cannot exceed 30 days')
            .optional()
            .default(3),
        maxLinksAllowed: z.coerce
            .number()
            .int()
            .min(1, 'Minimum 1 link must be allowed')
            .max(5, 'Maximum 5 links are allowed')
            .optional()
            .default(2),
        linkType: z
            .enum(['DoFollow', 'NoFollow'], {
                error: 'Link type must be either DoFollow or NoFollow',
                errorMap: () => ({ message: 'Link type must be either DoFollow or NoFollow' })
            })
            .optional()
            .default('DoFollow'),
        samplePostUrl: z
            .string()
            .trim()
            .url('Sample post URL must be a valid URL')
            .optional()
            .nullable()
            .or(z.literal(''))
            .transform((val) => (val === '' ? null : val ?? null)),

        // SEO Authority Scores (DR | DA | AS)
        mozDA: z
            .number({ error: 'Moz DA must be a number' })
            .int('Moz DA must be an integer')
            .min(0, 'Moz DA cannot be less than 0')
            .max(100, 'Moz DA cannot exceed 100')
            .optional()
            .nullable()
            .default(null),
        ahrefsDR: z
            .number({ error: 'Ahrefs DR must be a number' })
            .int('Ahrefs DR must be an integer')
            .min(0, 'Ahrefs DR cannot be less than 0')
            .max(100, 'Ahrefs DR cannot exceed 100')
            .optional()
            .nullable()
            .default(null),
        semrushAS: z
            .number({ error: 'Semrush AS must be a number' })
            .int('Semrush AS must be an integer')
            .min(0, 'Semrush AS cannot be less than 0')
            .max(100, 'Semrush AS cannot exceed 100')
            .optional()
            .nullable()
            .default(null),

        // Traffic, Backlinks, Domain Age & Deals (Marketplace Table UI Fields)
        monthlyTraffic: optionalNullableString.default(null),
        semrushTraffic: optionalNullableString.default(null),      // NEW: "120.8M"
        ahrefsTraffic: optionalNullableString.default(null),       // NEW: "75.9M"
        followedBacklinks: optionalNullableString.default(null),   // NEW: "266.8M"
        noFollowedBacklinks: optionalNullableString.default(null), // NEW: "55.9M"
        domainAge: optionalNullableString.default(null),           // "32Y 2M"
        totalDeals: z.coerce
            .number()
            .int()
            .min(0, 'Total deals cannot be negative')
            .optional()
            .default(0) // NEW: "250+"
    })
});

// 2. Check Domain Pre-Check Query Schema
const checkDomainQuerySchema = z.object({
    query: z.object({
        domain: domainFieldSchema
    })
});

// 3. List Seller Websites Query Schema
const listWebsitesQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(10),
        status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED']).optional(),
        category: z.string().trim().optional(),
        country: z.string().trim().optional(),
        search: z.string().trim().toLowerCase().optional()
    })
});

// 4. Website ID Param Schema
const websiteIdParamSchema = z.object({
    params: z.object({
        websiteId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Website ID format')
    })
});

// 5. Bulk CSV Row Validation Schema (Service ke andar har row ko validate karne ke liye)
const csvWebsiteRowSchema = z.object({
    domain: domainFieldSchema,
    country: z
        .string({ error: 'Country is mandatory', required_error: 'Country is mandatory' })
        .trim()
        .min(2, 'Country is mandatory and must be at least 2 characters'),
    otherCountriesCount: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? 0 : Number(val)),
        z.number().int().min(0).default(0)
    ),
    category: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : 'All')),
    price: z.coerce
        .number({ error: 'Price must be a valid number', invalid_type_error: 'Price must be a valid number' })
        .min(5, 'Price must be between $5 and $20,000')
        .max(20000, 'Price must be between $5 and $20,000'),
    contentWritingPrice: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? 0 : Number(val)),
        z.number().nonnegative('Content writing price cannot be negative').default(0)
    ),
    turnaroundDays: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? 3 : Number(val)),
        z
            .number({ error: 'Turnaround days must be a number', invalid_type_error: 'Turnaround days must be a number' })
            .int('Turnaround days must be an integer')
            .min(1, 'Turnaround days must be between 1 and 30 days')
            .max(30, 'Turnaround days must be between 1 and 30 days')
    ),
    maxLinksAllowed: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? 2 : Number(val)),
        z.number().int().min(1).max(5).default(2)
    ),
    linkType: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? 'DoFollow' : String(val).trim()),
        z.enum(['DoFollow', 'NoFollow']).default('DoFollow')
    ),
    language: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : 'English')),

    // Metrics
    mozDA: csvOptionalMetricScore('Moz DA'),
    ahrefsDR: csvOptionalMetricScore('Ahrefs DR'),
    semrushAS: csvOptionalMetricScore('Semrush AS'),

    // Traffic, Backlinks & Domain Info
    monthlyTraffic: optionalNullableString.default(null),
    semrushTraffic: optionalNullableString.default(null),
    ahrefsTraffic: optionalNullableString.default(null),
    followedBacklinks: optionalNullableString.default(null),
    noFollowedBacklinks: optionalNullableString.default(null),
    domainAge: optionalNullableString.default(null),
    totalDeals: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? 0 : Number(val)),
        z.number().int().min(0).default(0)
    ),
    samplePostUrl: z
        .string()
        .trim()
        .url('Sample post URL must be a valid URL')
        .optional()
        .nullable()
        .or(z.literal(''))
        .transform((val) => (val === '' ? null : val ?? null))
});

// ============================================================================
// NEW: ADMIN VALIDATION SCHEMAS (Added Here)
// ============================================================================

// 6. Admin List All Websites Query Schema
const adminListWebsitesQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(10),
        status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED']).optional(),
        sellerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Seller ID format').optional(),
        category: z.string().trim().optional(),
        country: z.string().trim().optional(),
        search: z.string().trim().toLowerCase().optional()
    })
});

// 7. Admin Verify / Update Website Status & SEO Metrics Schema
const adminReviewWebsiteSchema = z.object({
    params: z.object({
        websiteId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Website ID format')
    }),
    body: z.object({
        status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED'], {
            error: 'Status must be ACTIVE, REJECTED, SUSPENDED, or PENDING_VERIFICATION',
            required_error: 'Status is required'
        }),
        adminReviewNotes: optionalNullableString,
        mozDA: z.coerce.number().int().min(0).max(100).nullable().optional(),
        ahrefsDR: z.coerce.number().int().min(0).max(100).nullable().optional(),
        semrushAS: z.coerce.number().int().min(0).max(100).nullable().optional(),
        monthlyTraffic: optionalNullableString,
        semrushTraffic: optionalNullableString,
        ahrefsTraffic: optionalNullableString,
        followedBacklinks: optionalNullableString,
        noFollowedBacklinks: optionalNullableString,
        domainAge: optionalNullableString,
        otherCountriesCount: z.coerce.number().int().min(0).optional(),
        totalDeals: z.coerce.number().int().min(0).optional()
    })
});

module.exports = {
    addWebsiteSchema,
    checkDomainQuerySchema,
    listWebsitesQuerySchema,
    websiteIdParamSchema,
    csvWebsiteRowSchema,
    adminListWebsitesQuerySchema,
    adminReviewWebsiteSchema
};