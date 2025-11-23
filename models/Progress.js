const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
        ref: 'User'
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course'
    },
    completedLectures: {
        type: Number,
        default: 0
    },
    completedVideoIds: [{
        type: String
    }],
    totalLectures: {
        type: Number,
        default: 0 // Should be synced with Course.lectureNumber
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index to ensure unique progress record per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
