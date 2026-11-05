const { z } = require('zod');
const { USER_ROLES } = require('../constants/roles.constant');

const registerUserSchema = z.object({
    body: z
        .object({
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
            }),
            socialProfiles: z
                .object({
                    linkedin: z.string().trim().url({ message: 'Invalid LinkedIn URL' }).optional().nullable(),
                    facebook: z.string().trim().url({ message: 'Invalid Facebook URL' }).optional().nullable(),
                    instagram: z.string().trim().url({ message: 'Invalid Instagram URL' }).optional().nullable()
                })
                .optional()
                .nullable()
        })
        .refine(
            (data) => {
                // Agar role SELLER hai toh kam se kam ek social link compulsory hai
                if (data.role === USER_ROLES.SELLER) {
                    const profiles = data.socialProfiles || {};
                    return Boolean(profiles.linkedin || profiles.facebook || profiles.instagram);
                }
                // Buyer ke liye koi social media mandatory nahi hai
                return true;
            },
            {
                message: 'Seller registration requires at least one social media URL (LinkedIn, Facebook, or Instagram)',
                path: ['socialProfiles']
            }
        )
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