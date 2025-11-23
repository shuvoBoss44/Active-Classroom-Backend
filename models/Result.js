const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    wrongAnswers: {
        type: Number,
        default: 0
    },
    // Optional: Store student's answers for review
    answers: [{
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: Number,
        isCorrect: Boolean
    }]
}, { timestamps: true });

// Prevent multiple submissions for the same exam by the same user?
// For now, let's allow retakes, or we can enforce uniqueness:
// resultSchema.index({ userId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
