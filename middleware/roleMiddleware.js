const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                return next(new CustomError('Access denied. Insufficient permissions.', 403));
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = roleMiddleware;