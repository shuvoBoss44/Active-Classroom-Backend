const mongoose = require('mongoose');

// Course schema definition
const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    thumbnail: {
        type: String
    },
    demoVideo: {
        type: String
    },
    classType: {
        type: String,
        enum: ['SSC', 'HSC', "ADMISSION"],
        required: true
    },
    examsNumber: {
        type: Number,
        default: 0
    },
    lectureNumber: {
        type: Number,
        default: 0
    },
    studentsEnrolled: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    discountedPrice: {
        type: Number
    },
    instructors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    overview: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    faq: [{
        question: String,
        answer: String
    }],
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    facebookGroupLink: {
        type: String,
        trim: true
    },
    facebookGroupVideos: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        noteUrl: {
            type: String,
            trim: true
        }
    }],
    videos: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        duration: String, // e.g., "45:30"
        order: {
            type: Number,
            default: 0
        }
    }]
}, { timestamps: true });


// Export Course model
module.exports = mongoose.model('Course', courseSchema);