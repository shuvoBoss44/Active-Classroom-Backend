const express = require('express');
const router = express.Router();
const ExamController = require('../controllers/examController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Create Exam (Admin/Teacher only)
router.post('/create', authMiddleware, roleMiddleware(['admin', 'teacher']), ExamController.createExam);

// Update Exam (Admin/Teacher only)
router.put('/:examId', authMiddleware, roleMiddleware(['admin', 'teacher']), ExamController.updateExam);

// Delete Exam (Admin/Teacher only)
router.delete('/:examId', authMiddleware, roleMiddleware(['admin', 'teacher']), ExamController.deleteExam);

// Get Exams for a Course (Public/Student)
router.get('/course/:courseId', authMiddleware, ExamController.getExamsByCourse);

// Get All Exams (Public/Student)
router.get('/', authMiddleware, ExamController.getAllExams);

// Get Specific Exam (Student takes exam)
router.get('/:examId', authMiddleware, ExamController.getExamById);

// Submit Exam (Student)
router.post('/submit', authMiddleware, ExamController.submitExam);

// Get My Results (Student)
router.get('/results/me', authMiddleware, ExamController.getUserResults);

// Get Single Result (Solution View)
router.get('/results/:resultId', authMiddleware, ExamController.getResultById);

module.exports = router;
