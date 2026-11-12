const { z } = require('zod');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        // Assign sanitized and coerced values back to request safely
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) Object.assign(req.query, parsed.query);
        if (parsed.params) Object.assign(req.params, parsed.params);

        return next();
    } catch (err) {
        if (err instanceof z.ZodError || err.name === 'ZodError') {
            const rawIssues = err.issues || err.errors || [];
            const seenFields = new Set();
            const formattedErrors = [];

            for (const e of rawIssues) {
                const fieldName = e.path.length > 1
                    ? e.path.slice(1).join('.')
                    : e.path.join('.') || 'general';

                // Ek field ka sirf pehla exact error rakho (no duplicate noise)
                if (!seenFields.has(fieldName)) {
                    seenFields.add(fieldName);
                    formattedErrors.push({
                        field: fieldName,
                        message: e.message
                    });
                }
            }

            const primaryErrorMessage = formattedErrors.length > 0
                ? formattedErrors[0].message
                : 'Invalid request data';

            return next(ApiError(400, primaryErrorMessage, formattedErrors));
        }

        return next(err);
    }
};

module.exports = validate;