require('dotenv').config();
const mongoose = require('mongoose');
const Website = require('../models/website.model'); // Apne website.model.js ka exact path check kar lena
const { generateDomainSlug } = require('../utils/slugify'); // Apne slugify.js ka exact path check kar lena

async function backfillWebsiteSlugs() {
    try {
        // 1. Database se connect karo (.env me jo naam ho: MONGO_URI ya MONGODB_URI)
        const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!dbUri) {
            throw new Error('Database URI not found in .env file');
        }

        await mongoose.connect(dbUri);
        console.log('Connected to MongoDB...');

        // 2. Sirf wahi websites nikalo jinme slug missing, null, ya empty hai
        // .sort({ createdAt: 1 }) isliye taaki sabse pehle add hui website ko base slug (e.g. techcrunch.com) mile
        const websitesWithoutSlug = await Website.find({
            $or: [
                { slug: { $exists: false } },
                { slug: null },
                { slug: '' }
            ]
        }).sort({ createdAt: 1 });

        console.log(`Found ${websitesWithoutSlug.length} websites without slug.`);

        // 3. Ek-ek karke har website ka slug generate aur save karo
        let updatedCount = 0;
        for (const site of websitesWithoutSlug) {
            const newSlug = await generateDomainSlug(Website, site.domain);
            
            // updateOne use kar rahe hain taaki agar kisi purane record me koi aur validation field missing ho toh error na aaye
            await Website.updateOne(
                { _id: site._id },
                { $set: { slug: newSlug } }
            );

            updatedCount++;
            console.log(`[${updatedCount}/${websitesWithoutSlug.length}] ${site.domain} -> ${newSlug}`);
        }

        console.log(`\nMigration completed successfully! Total updated: ${updatedCount}`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

backfillWebsiteSlugs();