const { z } = require('zod');

const loginSchema = z.object({
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
    loginSchema
};