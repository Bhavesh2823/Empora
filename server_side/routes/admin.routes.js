const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');

// Admin login route
router.post('/login', AdminController.adminLogin);

module.exports = router;
