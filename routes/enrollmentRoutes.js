// routes/enrollmentRoutes.js
const express = require('express');
const router = express.Router();
const EnrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get enrollments by course (admin, moderator, teacher only)
router.get(
    '/course/:courseId',
    roleMiddleware(['admin', 'moderator', 'teacher']),
    EnrollmentController.getEnrollmentsByCourse
);

// Update acceptance status (admin, moderator, teacher only)
router.patch(
    '/:id/accept',
    roleMiddleware(['admin', 'moderator', 'teacher']),
    EnrollmentController.updateAcceptanceStatus
);

// Get pending enrollments count (admin, moderator, teacher only)
router.get(
    '/pending-count',
    roleMiddleware(['admin', 'moderator', 'teacher']),
    EnrollmentController.getPendingCount
);

// Get pending enrollments count for a specific course (admin, moderator, teacher only)
router.get(
    '/course/:courseId/pending-count',
    roleMiddleware(['admin', 'moderator', 'teacher']),
    EnrollmentController.getPendingCountByCourse
);

// Get user's own enrollments
router.get('/my-enrollments', EnrollmentController.getUserEnrollments);

module.exports = router;
