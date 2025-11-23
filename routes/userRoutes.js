const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const uploadProfile = require('../middleware/uploadProfile');

router.post('/sync', UserController.syncFirebase);
router.post('/logout', authMiddleware, UserController.logout);
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);
router.post('/profile/upload-image', authMiddleware, uploadProfile.single('image'), UserController.uploadProfileImage);
router.put('/role', authMiddleware, roleMiddleware(['admin']), UserController.updateRole);
router.get('/filter', authMiddleware, roleMiddleware(['admin']), UserController.filterUsers);
router.get("/getMe", authMiddleware, UserController.getMe);
router.delete('/:userId', authMiddleware, roleMiddleware(['admin']), UserController.deleteUser);
router.get('/', authMiddleware, roleMiddleware(['admin']), UserController.listUsers);
router.get("/teacher", UserController.getTeachers)
router.get('/:userId', authMiddleware, roleMiddleware(['admin']), UserController.getUserById);

module.exports = router;