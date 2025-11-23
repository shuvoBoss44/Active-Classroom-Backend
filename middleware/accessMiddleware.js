const mongoose = require('mongoose');
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

const accessMiddleware = async (req, res, next) => {
    try {
        const user = req.user;
        console.log(user)
        const courseId = req.params.courseId || req.body.courseId;
        if (!courseId) {
            return next(new CustomError('Course ID is required', 400));
        }
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new CustomError('Invalid Course ID', 400));
        }
        if (user.role === 'admin' || user.role === 'moderator' || user.role === 'teacher') {
            return next();
        }
        if (!user.purchasedCourses.map(id => id.toString()).includes(courseId)) {
            return next(new CustomError('Access denied. Course not purchased.', 403));
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = accessMiddleware;