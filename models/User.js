const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, 'Firebase UID is required'],
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    facebookId: {
        type: String,
        trim: true,
        default: null
    },
    schoolCollege: {
        type: String,
        trim: true,
        default: null
    },
    session: {
        type: String,
        trim: true,
        default: null
    },
    guardianPhone: {
        type: String,
        trim: true,
    },
    school: {
        type: String,
        trim: true,
    },
    college: {
        type: String,
        trim: true,
    },
    session: {
        type: String,
        trim: true,
    },
    facebookId: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'moderator', 'admin'],
        default: 'student',
        required: true,
    },
    profileImage: {
        type: String,
    },
    purchasedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);