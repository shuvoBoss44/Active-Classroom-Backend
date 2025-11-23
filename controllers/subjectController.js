const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

// Subject controller with CRUD operations
class SubjectController {
    static async createSubject(req, res, next) {
        try {
            const { name, courseId } = req.body;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }
            const course = await Course.findById(courseId);
            if (!course) {
                throw new CustomError('Course not found', 404);
            }
            const subject = new Subject({
                name,
                courseId,
                chapters: []
            });
            await subject.save();
            course.subjects.push(subject._id);
            await course.save();
            ResponseHandler.created(res, { subject }, 'Subject created successfully');
        } catch (error) {
            next(error);
        }
    }

    static async updateSubject(req, res, next) {
        try {
            const { subjectId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(subjectId)) {
                throw new CustomError('Invalid subject ID', 400);
            }
            const subject = await Subject.findById(subjectId);
            if (!subject) {
                throw new CustomError('Subject not found', 404);
            }
            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (key !== '_id' && key in subjectSchema.obj) {
                    updates[key] = req.body[key];
                }
            });
            const updatedSubject = await Subject.findByIdAndUpdate(
                subjectId,
                updates,
                { new: true, runValidators: true }
            );
            ResponseHandler.success(res, { subject: updatedSubject }, 'Subject updated successfully');
        } catch (error) {
            next(error);
        }
    }

    static async deleteSubject(req, res, next) {
        try {
            const { subjectId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(subjectId)) {
                throw new CustomError('Invalid subject ID', 400);
            }
            const subject = await Subject.findByIdAndDelete(subjectId);
            if (!subject) {
                throw new CustomError('Subject not found', 404);
            }
            await Course.updateOne(
                { subjects: subjectId },
                { $pull: { subjects: subjectId } }
            );
            ResponseHandler.success(res, {}, 'Subject deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    static async listSubjects(req, res, next) {
        try {
            const { courseId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }
            const course = await Course.findById(courseId);
            if (!course) {
                throw new CustomError('Course not found', 404);
            }
            const subjects = await Subject.find({ courseId })
                .populate('chapters', 'title')
                .lean();
            ResponseHandler.success(res, { subjects }, 'Subjects retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

const subjectSchema = Subject.schema;
module.exports = SubjectController;