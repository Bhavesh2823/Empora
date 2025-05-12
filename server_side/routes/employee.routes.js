const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employee.controller');
const verifyAdmin = require('../middlewares/admin_auth.middleware');


router.get('/', verifyAdmin, EmployeeController.getAllEmployees);
router.post('/create-emp', verifyAdmin, EmployeeController.createEmployee);
router.get('/:employeeId', verifyAdmin, EmployeeController.getEmployeeById);
router.put('/:employeeId', verifyAdmin, EmployeeController.updateEmployee);
router.delete('/:employeeId', verifyAdmin, EmployeeController.deleteEmployee);

module.exports = router;
