const { z } = require('zod');

const portfolioIdParamSchema = z.object({
    params: z.object({
        projectId: z
            .string({ required_error: 'Project ID is required' })
            .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Project ID format. Must be a 24-character hex string.' })
    })
});

const listPortfolioQuerySchema = z.object({
    query: z.object({
        category: z.string().optional()
    })
});

module.exports = {
    portfolioIdParamSchema,
    listPortfolioQuerySchema
};