const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Coupon routes
router.post('/', authMiddleware, roleMiddleware(['admin']), CouponController.createCoupon);
router.patch('/:couponId', authMiddleware, roleMiddleware(['admin']), CouponController.updateCoupon);
router.delete('/:couponId', authMiddleware, roleMiddleware(['admin']), CouponController.deleteCoupon);
router.get('/', authMiddleware, roleMiddleware(['admin']), CouponController.listCoupons);
router.post('/validate', authMiddleware, CouponController.validateCoupon);

module.exports = router;