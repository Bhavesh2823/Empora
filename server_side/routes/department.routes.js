// routes/department.routes.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const verifyAdmin = require('../middlewares/admin_auth.middleware');

router.use(verifyAdmin); // All department routes require admin authentication

router.post('/create-dept', departmentController.createDepartment);
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;