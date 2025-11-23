const express = require('express');
const router = express.Router();
const SSLCommerzService = require('../config/sslcommerz');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const transactionController = require('../controllers/transactionController');

router.post('/initiate', authMiddleware, SSLCommerzService.initiatePayment);
router.post('/success', SSLCommerzService.handleSuccess);
router.post('/fail', SSLCommerzService.handleFail);
router.post('/cancel', SSLCommerzService.handleCancel);
router.post('/ipn', SSLCommerzService.handleIPN);
router.get('/listTransaction', authMiddleware, roleMiddleware(['admin']), transactionController.listTransactions);
router.get('/getTransaction/:transactionId', authMiddleware, transactionController.getTransactionDetails);
router.get('/userTransactions', authMiddleware, transactionController.userTransactions);

module.exports = router;