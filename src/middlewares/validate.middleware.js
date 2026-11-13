const { z } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Converts technical Zod fallback errors into clean, human-readable UI messages
 */
const formatZodMessage = (fieldName, rawMessage) => {
    const label = fieldName
        .split('.')
        .pop()
        .replace(/([A-Z])/g, ' $1') // turnaroundDays -> turnaround Days
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

    if (rawMessage.includes('received undefined') || rawMessage === 'Required') {
        return `${label} is required`;
    }

    if (rawMessage.startsWith('Invalid input: expected')) {
        return `Invalid ${label.toLowerCase()} format`;
    }

    return rawMessage;
};

const validate = (schema) => async (req, res, next) => {
    try {
        if (!schema || typeof schema.parseAsync !== 'function') {
            return next(ApiError(500, 'Validation schema is missing or invalid'));
        }

        const parsed = await schema.parseAsync({
            body: req.body ?? {},
            query: req.query ?? {},
            params: req.params ?? {}
        });

        // Assign sanitized and coerced values back to request safely
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) {
            Object.keys(req.query).forEach((key) => delete req.query[key]);
            Object.assign(req.query, parsed.query);
        }
        if (parsed.params) {
            Object.keys(req.params).forEach((key) => delete req.params[key]);
            Object.assign(req.params, parsed.params);
        }

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

                // Keep only the first exact error per field (no duplicate noise)
                if (!seenFields.has(fieldName)) {
                    seenFields.add(fieldName);
                    formattedErrors.push({
                        field: fieldName,
                        message: formatZodMessage(fieldName, e.message)
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