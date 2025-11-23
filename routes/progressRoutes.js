const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/:courseId', progressController.getProgress);
router.post('/update', progressController.updateProgress);

module.exports = router;
