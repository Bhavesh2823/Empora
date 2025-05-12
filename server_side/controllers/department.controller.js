// controllers/department.controller.js
const DepartmentModel = require('../models/department.model');

exports.createDepartment = async (req, res) => {
  const { name } = req.body;
  const dbName = req.dbName;

  try {
    const department = await DepartmentModel.createDepartment(dbName, name);
    res.status(201).json({ success: true, department });
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllDepartments = async (req, res) => {
  const dbName = req.dbName;

  try {
    const departments = await DepartmentModel.getAllDepartments(dbName);
    res.status(200).json({ success: true, departments });
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDepartmentById = async (req, res) => {
  const dbName = req.dbName;
  const { id } = req.params;

  try {
    const department = await DepartmentModel.getDepartmentById(dbName, id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json({ success: true, department });
  } catch (err) {
    console.error('Error fetching department:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDepartment = async (req, res) => {
  const dbName = req.dbName;
  const { id } = req.params;
  const { name } = req.body;

  try {
    const updated = await DepartmentModel.updateDepartment(dbName, id, name);
    res.status(200).json({ success: true, department: updated });
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteDepartment = async (req, res) => {
  const dbName = req.dbName;
  const { id } = req.params;

  try {
    const result = await DepartmentModel.deleteDepartment(dbName, id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
