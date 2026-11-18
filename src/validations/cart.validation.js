const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;


const addToCartSchema = z.object({
    body: z.object({
        websiteId: z
            .string({ error: 'Website ID is required', required_error: 'Website ID is required' })
            .regex(objectIdRegex, 'Invalid Website ID format'),
        quantity: z.coerce.number().int().min(1).max(10).optional().default(1)
    })
});


const updateCartItemSchema = z.object({
    params: z.object({
        itemId: z.string().regex(objectIdRegex, 'Invalid Cart Item ID format')
    }),
    body: z.object({
        quantity: z.coerce
            .number({ error: 'Quantity is required', required_error: 'Quantity is required' })
            .int('Quantity must be a whole number')
            .min(1, 'Quantity must be at least 1')
            .max(10, 'Maximum 10 allowed')
    })
});


const cartItemParamSchema = z.object({
    params: z.object({
        itemId: z.string().regex(objectIdRegex, 'Invalid Cart Item ID format')
    })
});

module.exports = {
    addToCartSchema,
    updateCartItemSchema,
    cartItemParamSchema
};