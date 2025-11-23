// controllers/enrollmentController.js
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

class EnrollmentController {
    // GET ENROLLMENTS BY COURSE
    static async getEnrollmentsByCourse(req, res, next) {
        try {
            const { courseId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }

            const enrollments = await Enrollment.find({ course: courseId })
                .populate('user', 'name email profileImage')
                .populate('acceptedBy', 'name')
                .populate('course', 'title facebookGroupLink')
                .sort({ enrollmentDate: -1 })
                .lean();

            ResponseHandler.success(res, { enrollments }, 'Enrollments retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // UPDATE ACCEPTANCE STATUS
    static async updateAcceptanceStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { isAccepted } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new CustomError('Invalid enrollment ID', 400);
            }

            const updateData = {
                isAcceptedToFacebookGroup: isAccepted,
                acceptedBy: isAccepted ? req.user._id : null,
                acceptedAt: isAccepted ? new Date() : null
            };

            const enrollment = await Enrollment.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            )
                .populate('user', 'name email')
                .populate('acceptedBy', 'name');

            if (!enrollment) {
                throw new CustomError('Enrollment not found', 404);
            }

            ResponseHandler.success(
                res,
                { enrollment },
                `Enrollment ${isAccepted ? 'accepted' : 'unaccepted'} successfully`
            );
        } catch (error) {
            next(error);
        }
    }

    // GET USER'S ENROLLMENTS
    static async getUserEnrollments(req, res, next) {
        try {
            const userId = req.user._id;

            const enrollments = await Enrollment.find({ user: userId })
                .populate('course', 'title thumbnail classType')
                .sort({ enrollmentDate: -1 })
                .lean();

            ResponseHandler.success(res, { enrollments }, 'User enrollments retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
    // GET PENDING ENROLLMENTS COUNT
    static async getPendingCount(req, res, next) {
        try {
            // Count all enrollments that are not accepted yet
            const count = await Enrollment.countDocuments({
                isAcceptedToFacebookGroup: false
            });

            ResponseHandler.success(res, { count }, 'Pending enrollments count retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // GET PENDING ENROLLMENTS COUNT FOR A SPECIFIC COURSE
    static async getPendingCountByCourse(req, res, next) {
        try {
            const { courseId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }

            // Count enrollments for this course that are not accepted yet
            const count = await Enrollment.countDocuments({
                course: courseId,
                isAcceptedToFacebookGroup: false
            });

            ResponseHandler.success(res, { count }, 'Pending enrollments count for course retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = EnrollmentController;
