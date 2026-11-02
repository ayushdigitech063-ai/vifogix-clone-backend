const ApiError = (statusCode, message = "Something went wrong", errors = []) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.errors = errors;
    err.success = false;
    return err;
};

module.exports = ApiError;