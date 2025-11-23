// models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        default: '',
        trim: true
    },
    fileUrl: {
        type: String,
        required: true,  // NOW REQUIRED — because you said "I will give only the link"
        trim: true,
        validate: {
            validator: function (v) {
                return /^https?:\/\/drive\.google\.com/.test(v) ||
                    /^https?:\/\/docs\.google\.com/.test(v);
            },
            message: 'Please provide a valid Google Drive/Docs link'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

noteSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

noteSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Note', noteSchema);