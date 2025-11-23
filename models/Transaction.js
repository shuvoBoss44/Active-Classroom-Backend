const mongoose = require('mongoose');

// Transaction schema definition
const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        enum: ['BDT'],
        required: true
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    tranId: {
        type: String,
        required: true,
        unique: true
    },
    valId: {
        type: String
    },
    status: {
        type: String,
        enum: ['initiated', 'success', 'failed', 'cancelled'],
        default: 'initiated'
    },
    invoiceUrl: {
        type: String
    },
    facebookGroupLink: {
        type: String
    }
}, { timestamps: true });


// Export Transaction model
module.exports = mongoose.model('Transaction', transactionSchema);