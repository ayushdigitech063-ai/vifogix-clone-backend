const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const slugOrIdRegex = /^[a-z0-9-]+$|^[0-9a-fA-F]{24}$/;

// Activity Sub-Schema (Manual Monthly SEO Activity + Hidden Unit Add-On Price)
const packageActivitySchema = z.object({
    activityName: z
        .string({ error: 'SEO activity name is required', required_error: 'SEO activity name is required' })
        .trim()
        .min(2, 'Activity name must be at least 2 characters')
        .max(100, 'Activity name cannot exceed 100 characters'),
    monthlyCount: z.coerce
        .number({ error: 'Monthly quantity must be a valid number', required_error: 'Monthly quantity is required' })
        .int('Monthly quantity must be a whole number')
        .min(1, 'Monthly quantity must be at least 1'),
    unitAddonPrice: z.coerce
        .number({ error: 'Unit add-on price must be a valid number' })
        .min(0, 'Unit add-on price cannot be negative')
        .optional()
        .default(0),
    isAddonAllowed: z.boolean().optional().default(true)
});

// Shared Param Schema (Supports both slug e.g. 'authority-growth-plan' and 24-char ObjectId)
const slugParamObject = z.object({
    slug: z
        .string({ error: 'Package slug is required', required_error: 'Package slug is required' })
        .trim()
        .min(2, 'Invalid package identifier')
        .max(150, 'Package identifier is too long')
        .regex(slugOrIdRegex, 'Invalid package slug format')
});

// 1. Create Single Package Validation (Shared: Package Manager & Admin)
const createPackageSchema = z.object({
    body: z
        .object({
            name: z
                .string({ error: 'Package name is required', required_error: 'Package name is required' })
                .trim()
                .min(2, 'Package name must be at least 2 characters')
                .max(80, 'Package name cannot exceed 80 characters'),
            tagline: z
                .string({ error: 'Tagline is required', required_error: 'Tagline is required' })
                .trim()
                .min(2, 'Tagline must be at least 2 characters')
                .max(150, 'Tagline cannot exceed 150 characters'),
            price: z.coerce.number().min(0, 'Price cannot be negative').nullable().optional(),
            isCustomPrice: z.boolean().optional().default(false),
            customPriceLabel: z.string().trim().max(30).optional().default('Custom'),
            billingCycle: z.string().trim().max(20).nullable().optional().default('/mo'),
            activities: z
                .array(packageActivitySchema, {
                    error: 'Activities list is required',
                    required_error: 'At least one SEO activity is required'
                })
                .min(1, 'At least one SEO activity is required'),
            isPopular: z.boolean().optional().default(false),
            badgeText: z.string().trim().max(30).nullable().optional(),
            displayOrder: z.coerce.number().int().min(1, 'Display order must be at least 1').optional(),
            isActive: z.boolean().optional().default(true)
        })
        .strict()
        .refine(
            (data) => data.isCustomPrice || (data.price !== undefined && data.price !== null),
            {
                message: 'Price is required when isCustomPrice is false',
                path: ['price']
            }
        )
});

// 2. Update Single Package Validation (Shared: Package Manager & Admin)
const updatePackageSchema = z.object({
    params: slugParamObject,
    body: z
        .object({
            name: z.string().trim().min(2).max(80).optional(),
            tagline: z.string().trim().min(2).max(150).optional(),
            price: z.coerce.number().min(0).nullable().optional(),
            isCustomPrice: z.boolean().optional(),
            customPriceLabel: z.string().trim().max(30).optional(),
            billingCycle: z.string().trim().max(20).nullable().optional(),
            activities: z
                .array(packageActivitySchema)
                .min(1, 'At least one SEO activity is required')
                .optional(),
            isPopular: z.boolean().optional(),
            badgeText: z.string().trim().max(30).nullable().optional(),
            displayOrder: z.coerce.number().int().min(1, 'Display order must be at least 1').optional(),
            isActive: z.boolean().optional()
        })
        .strict()
        .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required to update'
        })
});

// 3. Package Slug Param Validation (View Details / Soft Delete)
const packageSlugParamSchema = z.object({
    params: slugParamObject
});

// 4. Toggle Package Active Status Validation (Shared: Package Manager & Admin)
const togglePackageStatusSchema = z.object({
    params: slugParamObject,
    body: z
        .object({
            isActive: z.boolean({
                error: 'isActive boolean value is required',
                required_error: 'isActive boolean value is required'
            })
        })
        .strict()
});

// 5. Admin Only: Verify / Approve / Reject / Suspend Package Validation
const reviewPackageSchema = z.object({
    params: slugParamObject,
    body: z
        .object({
            status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED'], {
                error: 'Status must be ACTIVE, REJECTED, SUSPENDED, or PENDING_VERIFICATION',
                required_error: 'Status is required'
            }),
            adminReviewNotes: z
                .string()
                .trim()
                .optional()
                .nullable()
                .transform((val) => (val && val.length > 0 ? val : null))
        })
        .strict()
});

// 6. List Packages Query Validation (Shared: Admin & Package Manager)
const listPackagesQuerySchema = z.object({
    query: z.object({
        status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED']).optional(),
        creatorRole: z.enum(['ADMIN', 'PACKAGE_MANAGER']).optional()
    })
});

// 7. Public/Buyer: Live Custom Add-On Price Calculation Validation
const calculatePackagePriceSchema = z.object({
    params: slugParamObject,
    body: z
        .object({
            customizations: z
                .array(
                    z.object({
                        activityId: z.string().regex(objectIdRegex, 'Invalid Activity ID format'),
                        selectedCount: z.coerce
                            .number({ error: 'Selected quantity must be a valid number' })
                            .int('Selected quantity must be a whole number')
                            .min(1, 'Selected quantity must be at least 1')
                    })
                )
                .optional()
                .default([])
        })
        .strict()
});

module.exports = {
    createPackageSchema,
    updatePackageSchema,
    packageSlugParamSchema,
    togglePackageStatusSchema,
    reviewPackageSchema,
    listPackagesQuerySchema,
    calculatePackagePriceSchema
};