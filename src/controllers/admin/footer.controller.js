const asyncHandler = require('../../utils/asyncHandler');
const { getFooterSettings, updateFooterSettings } = require('../../services/footer.service');


const fetchFooter = asyncHandler(async (req, res) => {
    const footer = await getFooterSettings();

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Footer settings fetched successfully',
        data: footer
    });
});


const modifyFooter = asyncHandler(async (req, res) => {
    const updatedFooter = await updateFooterSettings(req.body);

    return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Footer settings updated successfully',
        data: updatedFooter
    });
});

module.exports = {
    fetchFooter,
    modifyFooter
};