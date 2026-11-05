const Contact = require('../models/contact.model');
const ApiError = require('../utils/ApiError');

// Public inquiry creation (Open for anyone: Buyer or Seller)
const submitContactInquiry = async (data) => {
    const inquiry = await Contact.create({
        inquiryType: data.inquiryType,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        companySize: data.companySize || null,
        goal: data.goal,
        message: data.message,
        status: 'UNREAD'
    });

    return inquiry;
};

// Admin fetch all with filters (inquiryType: BUYER/SELLER, status, pagination)
const getAllInquiries = async ({ page = 1, limit = 10, status, inquiryType }) => {
    const filter = {};
    if (status) filter.status = status;
    if (inquiryType) filter.inquiryType = inquiryType;

    const skip = (Number(page) - 1) * Number(limit);

    const [inquiries, total] = await Promise.all([
        Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Contact.countDocuments(filter)
    ]);

    return {
        inquiries,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    };
};

const getInquiryById = async (contactId) => {
    const inquiry = await Contact.findById(contactId);
    if (!inquiry) {
        throw ApiError(404, 'Contact inquiry not found');
    }

    if (inquiry.status === 'UNREAD') {
        inquiry.status = 'READ';
        await inquiry.save();
    }

    return inquiry;
};

const updateInquiryStatusAndNotes = async (contactId, { status, adminNotes }) => {
    const inquiry = await Contact.findById(contactId);
    if (!inquiry) {
        throw ApiError(404, 'Contact inquiry not found');
    }

    if (status) inquiry.status = status;
    if (adminNotes !== undefined) inquiry.adminNotes = adminNotes;

    await inquiry.save();
    return inquiry;
};

const deleteInquiryById = async (contactId) => {
    const inquiry = await Contact.findByIdAndDelete(contactId);
    if (!inquiry) {
        throw ApiError(404, 'Contact inquiry not found');
    }
    return inquiry;
};

module.exports = {
    submitContactInquiry,
    getAllInquiries,
    getInquiryById,
    updateInquiryStatusAndNotes,
    deleteInquiryById
};