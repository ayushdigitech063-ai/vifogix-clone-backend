const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            trim: true,
            default:
                'Top #1 SEO & Guest Post Agency. We help you build a stronger online presence with trusted guest posts and link building.'
        },
        contactInfo: {
            email: {
                type: String,
                trim: true,
                lowercase: true,
                default: ''
            },
            phone: {
                type: String,
                trim: true,
                default: '+91 6201533997'
            },
            address: {
                type: String,
                trim: true,
                default: 'B-1, 60-189, Heera Path, Mansarovar Jaipur'
            }
        },
        socialLinks: {
            linkedin: { type: String, trim: true, default: 'https://in.linkedin.com/company/sumitdigitech' },
            // whatsApp: { type: String, trim: true, default: 'https://api.whatsapp.com/send/?phone=916201533997&text=Hello&type=phone_number&app_absent=0' },
            x: { type: String, trim: true, default: '' },
            youtube: { type: String, trim: true, default: '' },
            instagram: { type: String, trim: true, default: 'https://www.instagram.com/sumitdigitech' },
            facebook: { type: String, trim: true, default: 'https://www.facebook.com/summitdigitech' }
        },
        newsletter: {
            title: { type: String, trim: true, default: 'Newsletter' },
            subtitle: {
                type: String,
                trim: true,
                default: 'Get the latest updates, SEO tips, and exclusive offers.'
            }
        },
        copyrightText: {
            type: String,
            trim: true,
            default: '© 2026 All Rights Reserved by Vefogix Clone.'
        }
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Footer', footerSchema);