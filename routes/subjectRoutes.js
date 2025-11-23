const express = require('express');
const router = express.Router();
const SubjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const accessMiddleware = require('../middleware/accessMiddleware');

router.post('/', authMiddleware, roleMiddleware(['admin']), SubjectController.createSubject);
router.patch('/:subjectId', authMiddleware, roleMiddleware(['admin']), SubjectController.updateSubject);
router.delete('/:subjectId', authMiddleware, roleMiddleware(['admin']), SubjectController.deleteSubject);
router.get('/:courseId', authMiddleware, accessMiddleware, SubjectController.listSubjects);

module.exports = router;