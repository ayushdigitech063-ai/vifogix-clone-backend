const { z } = require('zod');

const addWebsiteSchema = z.object({
    body: z.object({
        domain: z.string({ required_error: 'Domain is required' }).trim().min(3),
        category: z.string().trim().optional().default('All'),
        
        // 👇 Mandatory Country validation
        country: z
            .string({ required_error: 'Country is mandatory' })
            .trim()
            .min(2, { message: 'Country name must be at least 2 characters long' }),

        language: z.string().trim().optional().default('English'),
        price: z.number({ required_error: 'Price is required' }).positive('Price must be greater than 0'),
        contentWritingPrice: z.number().nonnegative().optional().default(0),
        turnaroundDays: z.number().int().min(1).default(3),
        maxLinksAllowed: z.number().int().min(1).max(5).default(2),
        linkType: z.enum(['DoFollow', 'NoFollow']).default('DoFollow'),
        samplePostUrl: z.string().trim().url().optional().nullable(),
        mozDA: z.number().min(0).max(100).optional().nullable(),
        ahrefsDR: z.number().min(0).max(100).optional().nullable(),
        semrushAS: z.number().min(0).max(100).optional().nullable(),
        monthlyTraffic: z.string().trim().optional().nullable(),
        domainAge: z.string().trim().optional().nullable()
    })
});

const listWebsitesQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED']).optional(),
        category: z.string().optional(),
        country: z.string().optional(),
        search: z.string().optional()
    })
});

const websiteIdParamSchema = z.object({
    params: z.object({
        websiteId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Website ID' })
    })
});

module.exports = {
    addWebsiteSchema,
    listWebsitesQuerySchema,
    websiteIdParamSchema
};