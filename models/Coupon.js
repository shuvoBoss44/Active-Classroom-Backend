const mongoose = require('mongoose');

// Coupon schema definition
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    validUntil: {
        type: Date,
        required: true
    },
    courseIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Export Coupon model
module.exports = mongoose.model('Coupon', couponSchema);