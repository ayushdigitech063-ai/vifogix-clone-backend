const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        // Clean sanitized data wapas request me assign karein
        req.body = parsed.body || req.body;
        req.query = parsed.query || req.query;
        req.params = parsed.params || req.params;

        next();
    } catch (err) {
        // Zod format error messages
        const formattedErrors = err.errors ? err.errors.map(e => ({
            field: e.path.slice(1).join('.'),
            message: e.message
        })) : [];

        next(ApiError(400, 'Validation Failed', formattedErrors));
    }
};

module.exports = validate;