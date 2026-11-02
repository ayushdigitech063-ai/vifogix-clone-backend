const ApiResponse = (statusCode, data = {}, message = 'Success') => {
    return {
        success: statusCode < 400,
        statusCode,
        message,
        data
    };
};

module.exports = ApiResponse;