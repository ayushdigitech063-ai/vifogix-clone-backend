const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// 1. Create Single Package Validation
const createPackageSchema = z.object({
    body: z
        .object({
            name: z
                .string({ error: 'Package name is required', required_error: 'Package name is required' })
                .trim()
                .min(2, 'Package name must be at least 2 characters')
                .max(50, 'Package name cannot exceed 50 characters'),
            tagline: z
                .string({ error: 'Tagline is required', required_error: 'Tagline is required' })
                .trim()
                .min(2, 'Tagline must be at least 2 characters')
                .max(120, 'Tagline cannot exceed 120 characters'),
            price: z.number().min(0, 'Price cannot be negative').nullable().optional(),
            isCustomPrice: z.boolean().optional().default(false),
            customPriceLabel: z.string().trim().max(30).optional().default('Custom'),
            billingCycle: z.string().trim().max(20).nullable().optional().default('/mo'),
            features: z
                .array(z.string().trim().min(1, 'Feature cannot be empty'))
                .min(1, 'At least one feature is required'),
            isPopular: z.boolean().optional().default(false),
            badgeText: z.string().trim().max(30).nullable().optional(),
            // buttonText: z.string().trim().max(30).optional().default('Get Started'),
            displayOrder: z.number().int().min(1, 'Display order must be at least 1').optional(),
            isActive: z.boolean().optional().default(true)
        })
        .refine(
            (data) => data.isCustomPrice || (data.price !== undefined && data.price !== null),
            {
                message: 'Price is required when isCustomPrice is false',
                path: ['price']
            }
        )
});

// 2. Update Single Package Validation
const updatePackageSchema = z.object({
    params: z.object({
        packageId: z.string().regex(objectIdRegex, 'Invalid Package ID format')
    }),
    body: z
        .object({
            name: z.string().trim().min(2).max(50).optional(),
            tagline: z.string().trim().min(2).max(120).optional(),
            price: z.number().min(0).nullable().optional(),
            isCustomPrice: z.boolean().optional(),
            customPriceLabel: z.string().trim().max(30).optional(),
            billingCycle: z.string().trim().max(20).nullable().optional(),
            features: z.array(z.string().trim().min(1)).min(1).optional(),
            isPopular: z.boolean().optional(),
            badgeText: z.string().trim().max(30).nullable().optional(),
            // buttonText: z.string().trim().max(30).optional(),
            displayOrder: z.number().int().min(1, 'Display order must be at least 1').optional(),
            isActive: z.boolean().optional()
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required to update'
        })
});

// 3. Package ID Param Validation
const packageIdParamSchema = z.object({
    params: z.object({
        packageId: z.string().regex(objectIdRegex, 'Invalid Package ID format')
    })
});

module.exports = {
    createPackageSchema,
    updatePackageSchema,
    packageIdParamSchema
};