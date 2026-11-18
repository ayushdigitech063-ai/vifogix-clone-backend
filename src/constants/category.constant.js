const WEBSITE_CATEGORIES = {
    'SEO': [
        'Full SEO Packages',
        'Local SEO',
        'Press Release',
        'Combo Packages',
        'Guest Posts',
        'On-Page SEO',
        'Keyword Research',
        'Video SEO',
        'Off-Page SEO',
        'Technical SEO',
        'Link Building',
        'SEO Audit',
        'E-Commerce SEO',
        'International SEO'
    ],
    'Content Writing': [
        'Local SEO',
        'Professional Content Writing',
        'Press Release Content',
        'Articles & Blog Post',
        'Website Content',
        'Creative Writing',
        'Copywriting',
        'Resume Writing'
    ],
    'Internet Marketing': [
        'Google Ads',
        'Social Media Optimization',
        'Amazon Ads',
        'LinkedIn Ads',
        'Reddit Ads',
        'Snap Ads',
        'Social Media Marketing',
        'Influencer Marketing',
        'Facebook & Instagram Ads',
        'Email Marketing',
        'Affiliate Marketing',
        'YouTube Marketing'
    ],
    'Programming & Technology': [
        'Web Development',
        'Mobile App Development',
        'Software Development',
        'Wordpress Development',
        'Shopify Development',
        'Wix Development',
        'Woocommerce'
    ],
    'Graphic And Design': [
        'Logo Design',
        'Web And App Design',
        'Marketing Design',
        'Print Design',
        'Books And eBooks',
        'Video Editing',
        'Graphic Designing',
        'Email Template Design',
        'Social Media Design'
    ],
    'Business & Finance': [
        'Startups',
        'Stock Market & Trading',
        'Cryptocurrency & Blockchain',
        'Personal Finance',
        'Real Estate',
        'E-Commerce'
    ],
    'Health & Fitness': [
        'Nutrition & Diet',
        'Mental Health',
        'Weight Loss',
        'Yoga & Meditation',
        'Medical & Healthcare'
    ],
    'Lifestyle & Fashion': [
        'Fashion & Apparel',
        'Beauty & Skincare',
        'Home Decor',
        'Parenting & Family',
        'Travel & Hospitality'
    ],
    'General & News': [
        'World News',
        'Education & Career',
        'Entertainment',
        'Sports',
        'Automotive',
        'Gaming'
    ]
};

const VALID_CATEGORY_NAMES = Object.keys(WEBSITE_CATEGORIES);

module.exports = {
    WEBSITE_CATEGORIES,
    VALID_CATEGORY_NAMES
};