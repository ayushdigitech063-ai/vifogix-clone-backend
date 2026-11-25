const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rootRouter = require('./src/routes');
const { errorHandler } = require('./src/middlewares/error.middleware');

const app = express();

// Trust Render's reverse proxy (needed for rate-limiting & secure cookies)
app.set('trust proxy', 1);

// Allowed frontend origins
const allowedOrigins = [
    'https://vifogix-clone.vercel.app',
    'http://localhost:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Base Route Mount (/api/v1)
app.use('/api/v1', rootRouter);

// Central Global Error Handler
app.use(errorHandler);

module.exports = app;