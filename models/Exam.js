const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        required: true,
        trim: true
    }],
    correctOption: {
        type: Number, // Index of the correct option (0-3)
        required: true,
        min: 0
    },
    marks: {
        type: Number,
        default: 1
    }
});

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    duration: {
        type: Number, // In minutes
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    passMarks: {
        type: Number,
        default: 0
    },
    questions: [questionSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
