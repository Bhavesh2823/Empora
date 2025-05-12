const express = require('express');
const router = express.Router();
const controller = require('../controllers/attendance.controller');
const verifyAdmin = require('../middlewares/admin_auth.middleware');
const rateLimit = require('express-rate-limit');

const attendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many check-ins from this IP, please try again later.',
});

router.post('/checkin', verifyAdmin, attendanceLimiter, controller.checkIn);
router.post('/checkout', verifyAdmin, controller.checkOut);
router.get('/today/:employee_id', verifyAdmin, controller.getToday);

module.exports = router;
