const { z } = require('zod');
const { VALID_CATEGORY_NAMES } = require('../constants/category.constant');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,11}$/;

const identifierSchema = z
    .string({ error: 'Press release slug is required', required_error: 'Press release slug is required' })
    .trim()
    .refine(
        (val) => objectIdRegex.test(val) || slugRegex.test(val.toLowerCase()),
        'Invalid Press Release slug format'
    );

// 1. Seller: Create Press Release Validation
const createPressReleaseSchema = z.object({
    body: z
        .object({
            title: z
                .string({ error: 'Title is required', required_error: 'Title is required' })
                .trim()
                .min(3, 'Title must be at least 3 characters')
                .max(150, 'Title cannot exceed 150 characters'),
            packageDescription: z
                .string({
                    error: 'Package description is required',
                    required_error: 'Package description is required'
                })
                .trim()
                .min(10, 'Package description must be at least 10 characters')
                .max(2000, 'Package description cannot exceed 2000 characters'),
            image: z.string().trim().url('Image must be a valid URL').nullable().optional(),
            outletDomain: z
                .string()
                .trim()
                .toLowerCase()
                .regex(domainRegex, 'Invalid domain format (e.g., finance.yahoo.com)')
                .nullable()
                .optional(),
            outletsCount: z.coerce.number().int().min(1).optional().default(1),

            included: z.array(z.string().trim().min(1)).optional().default([]),
            excluded: z.array(z.string().trim().min(1)).optional().default([]),

            category: z.enum(VALID_CATEGORY_NAMES, {
                errorMap: () => ({ message: 'Invalid category selected' })
            }),
            subCategories: z
                .array(z.string().trim().min(1))
                .min(1, 'At least one subcategory is required'),
            country: z
                .string({ error: 'Country is required', required_error: 'Country is required' })
                .trim()
                .min(2),
            otherCountriesCount: z.coerce.number().int().min(0).optional().default(0),
            language: z.string().trim().min(2).optional().default('English'),

            mozDA: z.coerce.number().min(0).max(100).nullable().optional(),
            ahrefsDR: z.coerce.number().min(0).max(100).nullable().optional(),
            semrushAS: z.coerce.number().min(0).max(100).nullable().optional(),
            monthlyTraffic: z.string().trim().nullable().optional(),
            estimatedReach: z.string().trim().nullable().optional(),

            maxWordsAllowed: z.coerce.number().int().min(100).max(5000).optional().default(500),
            extraWordPricePer100: z.coerce.number().min(0).optional().default(0),
            maxLinksAllowed: z.coerce.number().int().min(1).max(10).optional().default(3),
            linkType: z.enum(['DoFollow', 'NoFollow', 'Sponsored']).optional().default('NoFollow'),
            maxImagesAllowed: z.coerce.number().int().min(0).max(10).optional().default(2),
            hasSponsoredTag: z.boolean().optional().default(true),

            price: z.coerce
                .number({ error: 'Price is required', required_error: 'Price is required' })
                .min(5, 'Price must be at least $5')
                .max(50000, 'Price cannot exceed $50,000'),
            isPrWritingAvailable: z.boolean().optional().default(false),
            prWritingPrice: z.coerce.number().min(0).optional().default(0),
            turnaroundDays: z.coerce.number().int().min(1).max(30).optional().default(2)
        })
        .refine(
            (data) =>
                !data.isPrWritingAvailable ||
                (data.prWritingPrice !== undefined && data.prWritingPrice > 0),
            {
                message: 'PR writing price must be greater than 0 when PR writing is enabled',
                path: ['prWritingPrice']
            }
        )
});

// 2. Seller: Update Press Release Validation (by slug)
const updatePressReleaseSchema = z.object({
    params: z.object({
        slug: identifierSchema
    }),
    body: z
        .object({
            title: z.string().trim().min(3).max(150).optional(),
            packageDescription: z.string().trim().min(10).max(2000).optional(),
            image: z.string().trim().url('Image must be a valid URL').nullable().optional(),
            outletDomain: z
                .string()
                .trim()
                .toLowerCase()
                .regex(domainRegex, 'Invalid domain format')
                .nullable()
                .optional(),
            outletsCount: z.coerce.number().int().min(1).optional(),
            included: z.array(z.string().trim().min(1)).optional(),
            excluded: z.array(z.string().trim().min(1)).optional(),
            category: z.enum(VALID_CATEGORY_NAMES).optional(),
            subCategories: z.array(z.string().trim().min(1)).min(1).optional(),
            country: z.string().trim().min(2).optional(),
            otherCountriesCount: z.coerce.number().int().min(0).optional(),
            language: z.string().trim().min(2).optional(),
            mozDA: z.coerce.number().min(0).max(100).nullable().optional(),
            ahrefsDR: z.coerce.number().min(0).max(100).nullable().optional(),
            semrushAS: z.coerce.number().min(0).max(100).nullable().optional(),
            monthlyTraffic: z.string().trim().nullable().optional(),
            estimatedReach: z.string().trim().nullable().optional(),
            maxWordsAllowed: z.coerce.number().int().min(100).max(5000).optional(),
            extraWordPricePer100: z.coerce.number().min(0).optional(),
            maxLinksAllowed: z.coerce.number().int().min(1).max(10).optional(),
            linkType: z.enum(['DoFollow', 'NoFollow', 'Sponsored']).optional(),
            maxImagesAllowed: z.coerce.number().int().min(0).max(10).optional(),
            hasSponsoredTag: z.boolean().optional(),
            price: z.coerce.number().min(5).max(50000).optional(),
            isPrWritingAvailable: z.boolean().optional(),
            prWritingPrice: z.coerce.number().min(0).optional(),
            turnaroundDays: z.coerce.number().int().min(1).max(30).optional()
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required to update'
        })
});

// 3. Admin: Approve / Reject / Suspend Press Release Validation (by slug)
const reviewPressReleaseStatusSchema = z.object({
    params: z.object({
        slug: identifierSchema
    }),
    body: z
        .object({
            status: z.enum(['ACTIVE', 'REJECTED', 'SUSPENDED'], {
                errorMap: () => ({ message: 'Status must be ACTIVE, REJECTED, or SUSPENDED' })
            }),
            adminReviewNotes: z.string().trim().max(500).nullable().optional()
        })
        .refine(
            (data) =>
                data.status === 'ACTIVE' ||
                (typeof data.adminReviewNotes === 'string' && data.adminReviewNotes.trim().length >= 3),
            {
                message: 'Admin review notes are required when rejecting or suspending a press release',
                path: ['adminReviewNotes']
            }
        )
});

// 4. Press Release Slug Param Validation
const prSlugParamSchema = z.object({
    params: z.object({
        slug: identifierSchema
    })
});

module.exports = {
    createPressReleaseSchema,
    updatePressReleaseSchema,
    reviewPressReleaseStatusSchema,
    prSlugParamSchema
};