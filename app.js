const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rootRouter = require('./src/routes');
const { errorHandler } = require('./src/middlewares/error.middleware');

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Base Route Mount (/api/v1)
app.use('/api/v1', rootRouter);

// Central Global Error Handler
app.use(errorHandler);

module.exports = app;