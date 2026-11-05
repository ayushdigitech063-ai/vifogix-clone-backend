const { z } = require('zod');
const { USER_ROLES } = require('../constants/roles.constant');

const registerUserSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: 'Name is required' })
            .trim()
            .min(2, { message: 'Name must be at least 2 characters long' }),
        email: z
            .string({ required_error: 'Email is required' })
            .trim()
            .email({ message: 'Invalid email address format' }),
        password: z
            .string({ required_error: 'Password is required' })
            .min(6, { message: 'Password must be at least 6 characters long' }),
        role: z.enum([USER_ROLES.BUYER, USER_ROLES.SELLER], {
            errorMap: () => ({ message: 'Role must be either BUYER or SELLER' })
        })
    })
});

const loginUserSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: 'Email is required' })
            .trim()
            .email({ message: 'Invalid email address format' }),
        password: z
            .string({ required_error: 'Password is required' })
            .min(6, { message: 'Password must be at least 6 characters long' })
    })
});

module.exports = {
    registerUserSchema,
    loginUserSchema
};