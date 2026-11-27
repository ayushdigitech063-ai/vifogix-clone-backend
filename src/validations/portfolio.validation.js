const { z } = require('zod');

const scoreFieldSchema = z.coerce
    .number({ error: 'Score must be a valid number', invalid_type_error: 'Score must be a valid number' })
    .int('Score must be an integer')
    .min(0, 'Score cannot be less than 0')
    .max(100, 'Score cannot exceed 100');

const lighthouseSchema = z.object({
    overall: scoreFieldSchema.optional(),
    performance: scoreFieldSchema.optional(),
    accessibility: scoreFieldSchema.optional(),
    bestPractices: scoreFieldSchema.optional(),
    seo: scoreFieldSchema.optional()
});

const parseJsonField = (schema, fieldName) =>
    z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                if (val.trim() === '') return undefined;
                try {
                    return JSON.parse(val);
                } catch {
                    return '__INVALID_JSON__';
                }
            }
            return val;
        },
        schema.refine((val) => val !== '__INVALID_JSON__', {
            message: `Invalid JSON format for ${fieldName}`
        })
    );

const parseBooleanField = z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
}, z.boolean());

// Slug ya MongoDB ObjectId dono accept karne ke liye
const identifierRegex = /^(?:[0-9a-fA-F]{24}|[a-z0-9]+(?:-[a-z0-9]+)*)$/;

const portfolioIdentifierParamSchema = z.object({
    params: z.object({
        identifier: z
            .string({ required_error: 'Project slug or ID is required' })
            .trim()
            .toLowerCase()
            .min(2, 'Invalid project identifier')
            .max(150, 'Identifier is too long')
            .regex(identifierRegex, 'Invalid project slug or ID format')
    })
});

const portfolioSlugParamSchema = z.object({
    params: z.object({
        slug: z
            .string({ required_error: 'Project slug is required' })
            .trim()
            .toLowerCase()
            .min(2, 'Invalid project slug')
            .max(150, 'Project slug is too long')
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid project slug format')
    })
});

const createPortfolioSchema = z.object({
    body: z.object({
        title: z
            .string({ error: 'Title is required', required_error: 'Title is required' })
            .trim()
            .min(2, 'Title must be at least 2 characters long'),
        domainUrl: z
            .string({ error: 'Domain URL is required', required_error: 'Domain URL is required' })
            .trim()
            .min(3, 'Domain URL is required'),
        category: z
            .string({ error: 'Category is required', required_error: 'Category is required' })
            .trim()
            .min(2, 'Category must be at least 2 characters long'),
        description: z
            .string({ error: 'Description is required', required_error: 'Description is required' })
            .trim()
            .min(10, 'Description must be at least 10 characters long'),
        lighthouse: parseJsonField(lighthouseSchema.optional(), 'lighthouse').optional(),
        technologies: parseJsonField(
            z.array(z.string().trim().min(1)).optional(),
            'technologies'
        ).optional(),
        isVerified: parseBooleanField.optional().default(true),
        coreWebVitalsPassed: parseBooleanField.optional().default(true),
        order: z.coerce.number().int().optional().default(0),
        isActive: parseBooleanField.optional().default(true)
    })
});

const updatePortfolioSchema = z.object({
    params: z.object({
        identifier: z
            .string({ required_error: 'Project slug or ID is required' })
            .trim()
            .toLowerCase()
            .regex(identifierRegex, 'Invalid project slug or ID format')
    }),
    body: z.object({
        title: z.string().trim().min(2, 'Title must be at least 2 characters long').optional(),
        domainUrl: z.string().trim().min(3, 'Domain URL is required').optional(),
        category: z.string().trim().min(2, 'Category must be at least 2 characters long').optional(),
        description: z.string().trim().min(10, 'Description must be at least 10 characters long').optional(),
        lighthouse: parseJsonField(lighthouseSchema.optional(), 'lighthouse').optional(),
        technologies: parseJsonField(
            z.array(z.string().trim().min(1)).optional(),
            'technologies'
        ).optional(),
        isVerified: parseBooleanField.optional(),
        coreWebVitalsPassed: parseBooleanField.optional(),
        order: z.coerce.number().int().optional(),
        isActive: parseBooleanField.optional()
    })
});

module.exports = {
    createPortfolioSchema,
    updatePortfolioSchema,
    portfolioIdentifierParamSchema,
    portfolioSlugParamSchema
};