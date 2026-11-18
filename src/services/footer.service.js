const Footer = require('../models/footer.model');


const getFooterSettings = async () => {
    let footer = await Footer.findOne().lean();

    if (!footer) {
        const created = await Footer.create({});
        footer = created.toObject();
    }

    return footer;
};


const updateFooterSettings = async (payload) => {
    // Ensure initial document exists
    const existingFooter = await getFooterSettings();

    const updateQuery = {};

    if (payload.description !== undefined) updateQuery.description = payload.description;
    if (payload.copyrightText !== undefined) updateQuery.copyrightText = payload.copyrightText;

   
    if (payload.contactInfo) {
        if (payload.contactInfo.email !== undefined) {
            updateQuery['contactInfo.email'] = payload.contactInfo.email;
        }
        if (payload.contactInfo.phone !== undefined) {
            updateQuery['contactInfo.phone'] = payload.contactInfo.phone;
        }
        if (payload.contactInfo.address !== undefined) {
            updateQuery['contactInfo.address'] = payload.contactInfo.address;
        }
    }

   
    if (payload.socialLinks) {
        const platforms = ['linkedin', 'x', 'youtube', 'instagram', 'facebook'];
        platforms.forEach((platform) => {
            if (payload.socialLinks[platform] !== undefined) {
                updateQuery[`socialLinks.${platform}`] = payload.socialLinks[platform];
            }
        });
    }

  
    if (payload.newsletter) {
        if (payload.newsletter.title !== undefined) {
            updateQuery['newsletter.title'] = payload.newsletter.title;
        }
        if (payload.newsletter.subtitle !== undefined) {
            updateQuery['newsletter.subtitle'] = payload.newsletter.subtitle;
        }
    }

    const updatedFooter = await Footer.findByIdAndUpdate(
        existingFooter._id,
        { $set: updateQuery },
        { new: true, runValidators: true }
    ).lean();

    return updatedFooter;
};

module.exports = {
    getFooterSettings,
    updateFooterSettings
};