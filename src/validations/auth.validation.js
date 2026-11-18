const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;


const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ error: 'Email is required', required_error: 'Email is required' })
            .trim()
            .email({ message: 'Invalid email address format' }),
        password: z
            .string({ error: 'Password is required', required_error: 'Password is required' })
            .min(6, { message: 'Password must be at least 6 characters long' })
    })
});


const listUsersQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(10),
        role: z.enum(['BUYER', 'SELLER']).optional(),
        status: z.enum(['ACTIVE', 'PENDING', 'REJECTED']).optional(),
        search: z.string().trim().max(100).optional()
    })
});


const userIdParamSchema = z.object({
    params: z.object({
        userId: z.string().regex(objectIdRegex, 'Invalid User ID format')
    })
});


const updateUserStatusSchema = z.object({
    params: z.object({
        userId: z.string().regex(objectIdRegex, 'Invalid User ID format')
    }),
    body: z.object({
        status: z.enum(['ACTIVE', 'PENDING', 'REJECTED'], {
            error: 'Status must be ACTIVE, PENDING, or REJECTED',
            required_error: 'Status is required'
        })
    })
});

module.exports = {
    loginSchema,
    listUsersQuerySchema,
    userIdParamSchema,
    updateUserStatusSchema
};