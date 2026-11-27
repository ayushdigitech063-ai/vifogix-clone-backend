const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const removeLocalFile = (localFilePath) => {
    if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
};

const uploadOnCloudinary = async (localFilePath, folder = 'marketplace_portfolio') => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'image',
            folder,
            transformation: [
                { width: 1200, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        removeLocalFile(localFilePath);
        return response.secure_url;
    } catch (error) {
        removeLocalFile(localFilePath);
        console.error('Cloudinary upload error:', error.message);
        return null;
    }
};

const deleteFromCloudinary = async (fileUrl) => {
    try {
        if (!fileUrl || !fileUrl.includes('cloudinary.com')) return null;

        // URL se '/upload/' ke baad ka version aur extension hata kar exact public_id nikalein
        const urlParts = fileUrl.split('/upload/');
        if (urlParts.length < 2) return null;

        const pathWithoutVersion = urlParts[1].replace(/^v\d+\//, '');
        const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
            invalidate: true
        });
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error.message);
        return null;
    }
};

module.exports = {
    uploadOnCloudinary,
    deleteFromCloudinary,
    removeLocalFile
};