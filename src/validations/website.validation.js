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

    // Standard domain format check
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(input)) return null;

    // Extract clean root domain
    return input
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .split('?')[0]
        .trim();
};

// Reusable Domain Zod Schema with Transform
const domainFieldSchema = z
    .string({ required_error: 'Domain is required' })
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
            .string({ required_error: 'Country is mandatory' })
            .trim()
            .min(2, 'Country name must be at least 2 characters long'),
        language: z
            .string()
            .trim()
            .optional()
            .transform((val) => (val && val.length > 0 ? val : 'English')),
        price: z
            .number({
                required_error: 'Price is required',
                invalid_type_error: 'Price must be a valid number'
            })
            .min(5, 'Price must be at least $5')
            .max(20000, 'Price cannot exceed $20,000'),
        contentWritingPrice: z
            .number({ invalid_type_error: 'Content writing price must be a number' })
            .nonnegative('Content writing price cannot be negative')
            .optional()
            .default(0),
        turnaroundDays: z
            .number({ invalid_type_error: 'Turnaround days must be a number' })
            .int('Turnaround days must be a whole number')
            .min(1, 'Turnaround days must be at least 1 day')
            .max(30, 'Turnaround days cannot exceed 30 days')
            .optional()
            .default(3),
        maxLinksAllowed: z
            .number()
            .int()
            .min(1, 'Minimum 1 link must be allowed')
            .max(5, 'Maximum 5 links are allowed')
            .optional()
            .default(2),
        linkType: z
            .enum(['DoFollow', 'NoFollow'], {
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
        mozDA: z
            .number()
            .int('Moz DA must be an integer')
            .min(0, 'Moz DA cannot be less than 0')
            .max(100, 'Moz DA cannot exceed 100')
            .optional()
            .nullable()
            .default(null),
        ahrefsDR: z
            .number()
            .int('Ahrefs DR must be an integer')
            .min(0, 'Ahrefs DR cannot be less than 0')
            .max(100, 'Ahrefs DR cannot exceed 100')
            .optional()
            .nullable()
            .default(null),
        semrushAS: z
            .number()
            .int('Semrush AS must be an integer')
            .min(0, 'Semrush AS cannot be less than 0')
            .max(100, 'Semrush AS cannot exceed 100')
            .optional()
            .nullable()
            .default(null),
        monthlyTraffic: z.string().trim().optional().nullable().default(null),
        domainAge: z.string().trim().optional().nullable().default(null)
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
        .string({ required_error: 'Country is mandatory' })
        .trim()
        .min(2, 'Country is mandatory and must be at least 2 characters'),
    category: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : 'All')),
    price: z.coerce
        .number({ invalid_type_error: 'Price must be a valid number' })
        .min(5, 'Price must be between $5 and $20,000')
        .max(20000, 'Price must be between $5 and $20,000'),
    turnaroundDays: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? 3 : Number(val)),
        z
            .number({ invalid_type_error: 'Turnaround days must be a number' })
            .int('Turnaround days must be an integer')
            .min(1, 'Turnaround days must be between 1 and 30 days')
            .max(30, 'Turnaround days must be between 1 and 30 days')
    ),
    language: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val && val.length > 0 ? val : 'English')),
    mozDA: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? null : Number(val)),
        z.number().int().min(0, 'Moz DA must be between 0 and 100').max(100, 'Moz DA must be between 0 and 100').nullable()
    ),
    ahrefsDR: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? null : Number(val)),
        z.number().int().min(0, 'Ahrefs DR must be between 0 and 100').max(100, 'Ahrefs DR must be between 0 and 100').nullable()
    ),
    semrushAS: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? null : Number(val)),
        z.number().int().min(0, 'Semrush AS must be between 0 and 100').max(100, 'Semrush AS must be between 0 and 100').nullable()
    ),
    monthlyTraffic: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((val) => (val ? String(val) : null)),
    domainAge: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((val) => (val ? String(val) : null)),
    samplePostUrl: z
        .string()
        .trim()
        .url('Sample post URL must be a valid URL')
        .optional()
        .nullable()
        .or(z.literal(''))
        .transform((val) => (val === '' ? null : val ?? null))
});

module.exports = {
    addWebsiteSchema,
    checkDomainQuerySchema,
    listWebsitesQuerySchema,
    websiteIdParamSchema,
    csvWebsiteRowSchema
};