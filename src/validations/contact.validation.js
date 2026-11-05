const { z } = require('zod');

const submitContactSchema = z.object({
    body: z.object({
        inquiryType: z.enum(['BUYER', 'SELLER'], {
            errorMap: () => ({ message: 'Inquiry type must be either BUYER or SELLER' })
        }),
        name: z
            .string({ required_error: 'Name is required' })
            .trim()
            .min(2, { message: 'Name must be at least 2 characters long' }),
        email: z
            .string({ required_error: 'Email is required' })
            .trim()
            .email({ message: 'Invalid email address format' }),
        phone: z
            .string()
            .trim()
            .optional()
            .nullable(),
        companySize: z
            .string()
            .trim()
            .optional()
            .nullable(),
        goal: z
            .string({ required_error: 'Goal is required' })
            .trim()
            .min(1, { message: 'Please select your goal' }),
        message: z
            .string({ required_error: 'Message is required' })
            .trim()
            .min(5, { message: 'Message must be at least 5 characters long' })
    })
});

const updateContactAdminSchema = z.object({
    params: z.object({
        contactId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Contact ID format' })
    }),
    body: z.object({
        status: z.enum(['UNREAD', 'READ', 'IN_PROGRESS', 'RESOLVED']).optional(),
        adminNotes: z.string().trim().optional()
    })
});

module.exports = {
    submitContactSchema,
    updateContactAdminSchema
};