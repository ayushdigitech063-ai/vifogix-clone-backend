const { z } = require('zod');

const optionalUrl = z
    .string()
    .trim()
    .url('Please enter a valid URL (e.g., https://linkedin.com/company/...)')
    .or(z.literal(''))
    .optional();

const updateFooterSchema = z.object({
    body: z.object({
        description: z
            .string()
            .trim()
            .min(10, 'Description must be at least 10 characters')
            .max(500, 'Description cannot exceed 500 characters')
            .optional(),
        contactInfo: z
            .object({
                email: z.string().trim().email('Please enter a valid email address').optional(),
                phone: z.string().trim().min(5, 'Phone number is too short').max(30).optional(),
                address: z.string().trim().min(3, 'Address is too short').max(300).optional()
            })
            .optional(),
        socialLinks: z
            .object({
                linkedin: optionalUrl,
                x: optionalUrl,
                youtube: optionalUrl,
                instagram: optionalUrl,
                facebook: optionalUrl
            })
            .optional(),
        newsletter: z
            .object({
                title: z.string().trim().min(2).max(100).optional(),
                subtitle: z.string().trim().min(5).max(250).optional()
            })
            .optional(),
        copyrightText: z.string().trim().min(5).max(200).optional()
    })
});

module.exports = {
    updateFooterSchema
};