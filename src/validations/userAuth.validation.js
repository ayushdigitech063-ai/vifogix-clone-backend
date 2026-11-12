const { z } = require('zod');
const { USER_ROLES } = require('../constants/roles.constant');

// Helper: URL ya username me se clean slug nikaalne ke liye
const extractUsernameSlug = (input) => {
    if (!input || typeof input !== 'string') return '';
    let val = input.trim();

    val = val.replace(/^https?:\/\//i, '');
    val = val.replace(/^(?:[a-z0-9_-]+\.)*(?:linkedin\.com|facebook\.com|instagram\.com)\/?/i, '');
    val = val.replace(/^in\//i, '');
    val = val.replace(/^profile\.php\?id=/i, '');
    val = val.replace(/^@/, '');
    val = val.split(/[?#]/)[0].replace(/\/+$/, '');

    return val;
};

// LinkedIn: 3–100 chars (letters, numbers, hyphens) -> canonical URL
const linkedinUrlSchema = z
    .string()
    .trim()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional()
    .superRefine((val, ctx) => {
        if (!val) return;
        const slug = extractUsernameSlug(val);
        if (slug.length < 3 || slug.length > 100 || !/^[a-zA-Z0-9-]+$/.test(slug)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid LinkedIn profile URL or username'
            });
        }
    })
    .transform((val) => (val ? `https://linkedin.com/in/${extractUsernameSlug(val)}` : null));

// Facebook: min 3 chars (letters, numbers, periods, hyphens) -> canonical URL
const facebookUrlSchema = z
    .string()
    .trim()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional()
    .superRefine((val, ctx) => {
        if (!val) return;
        const slug = extractUsernameSlug(val);
        if (slug.length < 3 || !/^[a-zA-Z0-9.-]+$/.test(slug)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid Facebook profile URL or username'
            });
        }
    })
    .transform((val) => (val ? `https://facebook.com/${extractUsernameSlug(val)}` : null));

// Instagram: 1–30 chars (no leading/trailing period) -> canonical URL
const instagramUrlSchema = z
    .string()
    .trim()
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional()
    .superRefine((val, ctx) => {
        if (!val) return;
        const slug = extractUsernameSlug(val);
        if (
            slug.length < 1 ||
            slug.length > 30 ||
            slug.startsWith('.') ||
            slug.endsWith('.') ||
            !/^[a-zA-Z0-9._]+$/.test(slug)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid Instagram profile URL or username'
            });
        }
    })
    .transform((val) => (val ? `https://instagram.com/${extractUsernameSlug(val)}` : null));

// 1. Register Schema (Exact Tumhari Original Fields)
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
                .toLowerCase()
                .email({ message: 'Invalid email address format' }),
            password: z
                .string({ required_error: 'Password is required' })
                .min(8, { message: 'Password must be at least 8 characters long' }),
            role: z
                .enum(['buyer', 'seller', USER_ROLES.BUYER, USER_ROLES.SELLER], {
                    errorMap: () => ({ message: 'Role must be either BUYER or SELLER' })
                })
                .transform((val) => val.toUpperCase()),
            socialProfiles: z
                .object({
                    linkedin: linkedinUrlSchema,
                    facebook: facebookUrlSchema,
                    instagram: instagramUrlSchema
                })
                .optional()
                .nullable()
        })
        .refine(
            (data) => {
                if (data.role === USER_ROLES.SELLER) {
                    const profiles = data.socialProfiles || {};
                    return Boolean(profiles.linkedin || profiles.facebook || profiles.instagram);
                }
                return true;
            },
            {
                message: 'Seller registration requires at least one social media profile (LinkedIn, Facebook, or Instagram)',
                path: ['socialProfiles']
            }
        )
});

// 2. Login Schema (Exact Tumhari Original Fields)
const loginUserSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: 'Email is required' })
            .trim()
            .toLowerCase()
            .email({ message: 'Invalid email address format' }),
        password: z
            .string({ required_error: 'Password is required' })
            .min(1, { message: 'Password is required' })
    })
});

module.exports = {
    registerUserSchema,
    loginUserSchema
};