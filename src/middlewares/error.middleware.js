const errorHandler = (err, req, res, next) => {
    // Default values agar undefined ho
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const errors = err.errors || [];

    return res.status(statusCode).json({
        success: false,
        statusCode: statusCode,
        message: message,
        errors: errors
    });
};

module.exports = { errorHandler };