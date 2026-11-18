const { z } = require('zod');

const toggleWishlistSchema = z.object({
    body: z.object({
        websiteId: z
            .string({ error: 'Website ID is required', required_error: 'Website ID is required' })
            .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Website ID format')
    })
});

const getWishlistQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(10)
    })
});

const removeWishlistParamSchema = z.object({
    params: z.object({
        websiteId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Website ID format')
    })
});

module.exports = {
    toggleWishlistSchema,
    getWishlistQuerySchema,
    removeWishlistParamSchema
};