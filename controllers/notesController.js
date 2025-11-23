// controllers/notesController.js
const Note = require('../models/Notes');
const ResponseHandler = require('../utils/responseHandler');

class NotesController {
    // Create Note — ONLY Google Drive Link
    static async createNote(req, res) {
        try {
            const { title, content, fileUrl } = req.body;

            if (!title || !fileUrl) {
                return ResponseHandler.error(res, 'Title and Google Drive link are required', 400);
            }

            const note = new Note({
                title,
                content: content || '',
                fileUrl,
                createdBy: req.user._id
            });

            await note.save();
            await note.populate('createdBy', 'name role');

            ResponseHandler.created(res, { note }, 'Note created successfully');
        } catch (error) {
            ResponseHandler.error(res, error.message || 'Failed to create note', 500);
        }
    }

    // Get All Notes (Public)
    static async getAllNotes(req, res) {
        try {
            const { search } = req.query;
            let query = {};

            if (search) {
                query.$text = { $search: search };
            }

            const notes = await Note.find(query)
                .populate('createdBy', 'name role')
                .sort({ createdAt: -1 });

            ResponseHandler.success(res, { notes }, 'Notes retrieved successfully');
        } catch (error) {
            ResponseHandler.error(res, 'Failed to fetch notes', 500);
        }
    }

    // Update Note
    static async updateNote(req, res) {
        try {
            const { noteId } = req.params;
            const updates = req.body;

            const note = await Note.findById(noteId);
            if (!note) return ResponseHandler.error(res, 'Note not found', 404);

            if (note.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return ResponseHandler.error(res, 'Unauthorized', 403);
            }

            Object.keys(updates).forEach(key => {
                if (updates[key]) note[key] = updates[key];
            });

            note.updatedAt = Date.now();
            await note.save();
            await note.populate('createdBy', 'name role');

            ResponseHandler.success(res, { note }, 'Note updated');
        } catch (error) {
            ResponseHandler.error(res, 'Update failed', 500);
        }
    }

    // Delete Note
    static async deleteNote(req, res) {
        try {
            const { noteId } = req.params;
            const note = await Note.findById(noteId);

            if (!note) return ResponseHandler.error(res, 'Note not found', 404);

            if (note.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return ResponseHandler.error(res, 'Unauthorized', 403);
            }

            await Note.findByIdAndDelete(noteId);
            ResponseHandler.success(res, {}, 'Note deleted');
        } catch (error) {
            ResponseHandler.error(res, 'Delete failed', 500);
        }
    }
}

module.exports = NotesController;