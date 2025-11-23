const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const Course = require('../models/Course');
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

// Coupon controller with CRUD operations
class CouponController {
    static async createCoupon(req, res, next) {
        try {
            const { code, discountPercentage, validUntil, courseIds } = req.body;
            if (courseIds && courseIds.length > 0) {
                const courses = await Course.find({ _id: { $in: courseIds } });
                if (courses.length !== courseIds.length) {
                    throw new CustomError('One or more courses not found', 404);
                }
            }
            const coupon = new Coupon({
                code,
                discountPercentage,
                validUntil,
                courseIds: courseIds || [],
                createdBy: req.user._id
            });
            await coupon.save();
            ResponseHandler.created(res, { coupon }, 'Coupon created successfully');
        } catch (error) {
            next(error);
        }
    }

    static async updateCoupon(req, res, next) {
        try {
            const { couponId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(couponId)) {
                throw new CustomError('Invalid coupon ID', 400);
            }
            const coupon = await Coupon.findById(couponId);
            if (!coupon) {
                throw new CustomError('Coupon not found', 404);
            }
            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (key !== '_id' && key in couponSchema.obj) {
                    updates[key] = req.body[key];
                }
            });
            if (updates.courseIds && updates.courseIds.length > 0) {
                const courses = await Course.find({ _id: { $in: updates.courseIds } });
                if (courses.length !== updates.courseIds.length) {
                    throw new CustomError('One or more courses not found', 404);
                }
            }
            const updatedCoupon = await Coupon.findByIdAndUpdate(
                couponId,
                updates,
                { new: true, runValidators: true }
            );
            ResponseHandler.success(res, { coupon: updatedCoupon }, 'Coupon updated successfully');
        } catch (error) {
            next(error);
        }
    }

    static async deleteCoupon(req, res, next) {
        try {
            const { couponId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(couponId)) {
                throw new CustomError('Invalid coupon ID', 400);
            }
            const coupon = await Coupon.findByIdAndDelete(couponId);
            if (!coupon) {
                throw new CustomError('Coupon not found', 404);
            }
            ResponseHandler.success(res, {}, 'Coupon deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    static async listCoupons(req, res, next) {
        try {
            const coupons = await Coupon.find()
                .populate('courseIds', 'title')
                .populate('createdBy', 'name email')
                .lean();
            ResponseHandler.success(res, { coupons }, 'Coupons retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    static async validateCoupon(req, res, next) {
        try {
            const { code, courseId } = req.body;
            if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
                throw new CustomError('Invalid course ID', 400);
            }
            const coupon = await Coupon.findOne({ code });
            if (!coupon) {
                throw new CustomError('Invalid coupon code', 400);
            }
            if (coupon.validUntil < new Date()) {
                throw new CustomError('Coupon has expired', 400);
            }
            if (courseId && coupon.courseIds.length > 0 && !coupon.courseIds.map(id => id.toString()).includes(courseId)) {
                throw new CustomError('Coupon not applicable to this course', 400);
            }
            ResponseHandler.success(res, { coupon }, 'Coupon validated successfully');
        } catch (error) {
            next(error);
        }
    }
}

const couponSchema = Coupon.schema;
module.exports = CouponController;