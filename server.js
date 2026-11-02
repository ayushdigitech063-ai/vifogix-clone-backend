require('dotenv').config({ path: './.env' });
const app = require('./app');
const connectDB = require('./src/config/db.config');

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server startup error:', error.message);
        process.exit(1);
    }
};

startServer();