const asyncHandler = require('../utils/asyncHandler');
const {
    submitContactInquiry,
    getAllInquiries,
    getInquiryById,
    updateInquiryStatusAndNotes,
    deleteInquiryById
} = require('../services/contact.service');

// Public Handler: Submit Form
const createInquiry = asyncHandler(async (req, res) => {
    const inquiry = await submitContactInquiry(req.body);

    return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Your inquiry has been submitted successfully.',
        data: { inquiry }
    });
});

// Admin Handlers
const listInquiries = asyncHandler(async (req, res) => {
    const { page, limit, status, inquiryType } = req.query;
    const result = await getAllInquiries({ page, limit, status, inquiryType });

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Inquiries fetched successfully',
        data: result
    });
});

const getInquiryDetails = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const inquiry = await getInquiryById(contactId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Inquiry details fetched successfully',
        data: { inquiry }
    });
});

const updateInquiry = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const { status, adminNotes } = req.body;

    const inquiry = await updateInquiryStatusAndNotes(contactId, { status, adminNotes });

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Inquiry updated successfully',
        data: { inquiry }
    });
});

const removeInquiry = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    await deleteInquiryById(contactId);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Inquiry deleted successfully',
        data: {}
    });
});

module.exports = {
    createInquiry,
    listInquiries,
    getInquiryDetails,
    updateInquiry,
    removeInquiry
};