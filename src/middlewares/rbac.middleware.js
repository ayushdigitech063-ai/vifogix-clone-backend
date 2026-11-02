const ApiError = require('../utils/ApiError');

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return next(ApiError(401, 'Authentication required before checking permissions.'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(ApiError(403, `Access forbidden. Role '${req.user.role}' is not allowed to access this resource.`));
        }

        next();
    };
};

module.exports = { authorizeRoles };