const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const accessMiddleware = require('../middleware/accessMiddleware');
const upload = require('../middleware/upload');

// routes/courses.js

router.post('/', authMiddleware, roleMiddleware(['admin']), upload.single('thumbnail'), CourseController.createCourse);
router.put('/:courseId', authMiddleware, roleMiddleware(['admin', "moderator", "teacher"]), upload.single('thumbnail'), CourseController.updateCourse);
router.delete('/:courseId', authMiddleware, roleMiddleware(['admin']), CourseController.deleteCourse);
router.get('/', CourseController.listCourses);
router.get('/:courseId', CourseController.getCourseDetails);
router.post('/enroll', authMiddleware, CourseController.updateEnrollment);
router.get("/popular", CourseController.listPopularCourses)

module.exports = router;