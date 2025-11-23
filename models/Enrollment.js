// models/Enrollment.js
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    // User information at time of enrollment
    phone: {
        type: String,
        required: true,
        trim: true
    },
    facebookId: {
        type: String,
        required: true,
        trim: true
    },
    schoolCollege: {
        type: String,
        required: true,
        trim: true
    },
    session: {
        type: String,
        required: true,
        trim: true
    },
    // Facebook group acceptance tracking
    isAcceptedToFacebookGroup: {
        type: Boolean,
        default: false
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    // Payment details
    transactionId: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    couponUsed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
enrollmentSchema.index({ course: 1, enrollmentDate: -1 });
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true }); // One enrollment per user per course

module.exports = mongoose.model('Enrollment', enrollmentSchema);
