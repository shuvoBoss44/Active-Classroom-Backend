const mongoose = require('mongoose');

// Subject schema definition
const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    chapters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
    }]
}, { timestamps: true });

// Export Subject model
module.exports = mongoose.model('Subject', subjectSchema);