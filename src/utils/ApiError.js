function ApiError(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.data = null;
    error.message = message;
    error.success = false;
    error.errors = Array.isArray(errors) ? errors : [];

    if (stack) {
        error.stack = stack;
    } else {
        Error.captureStackTrace(error, ApiError);
    }

    return error;
}

module.exports = ApiError;