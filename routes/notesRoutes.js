// routes/notesRoutes.js
const express = require('express');
const router = express.Router();
const NotesController = require('../controllers/notesController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public: Get all notes + search
router.get('/', NotesController.getAllNotes);

// Create note (Teacher+)
router.post(
    '/',
    authMiddleware,
    roleMiddleware(['teacher', 'moderator', 'admin']),
    NotesController.createNote
);

// Update note
router.put('/:noteId', authMiddleware, roleMiddleware(['teacher', 'moderator', 'admin']), NotesController.updateNote);

// Delete note
router.delete('/:noteId', authMiddleware, roleMiddleware(['teacher', 'moderator', 'admin']), NotesController.deleteNote);

module.exports = router;