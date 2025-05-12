// models/department.model.js
const { getClientDBConnection } = require('../utils/dbConnector');

const DepartmentModel = {
  async createDepartment(dbName, name) {
    const db = await getClientDBConnection(dbName);
    const [result] = await db.query(
      'INSERT INTO departments (department_name) VALUES (?)',
      [name]
    );
    return { id: result.insertId, name };
  },

  async getAllDepartments(dbName) {
    const db = await getClientDBConnection(dbName);
    const [rows] = await db.query('SELECT * FROM departments');
    return rows;
  },

  async getDepartmentById(dbName, id) {
    const db = await getClientDBConnection(dbName);
    const [rows] = await db.query('SELECT * FROM departments WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async updateDepartment(dbName, id, name) {
    const db = await getClientDBConnection(dbName);
    await db.query('UPDATE departments SET department_name = ? WHERE id = ?', [name, id]);
    return { id, name };
  },

  async deleteDepartment(dbName, id) {
    const db = await getClientDBConnection(dbName);
    await db.query('DELETE FROM departments WHERE id = ?', [id]);
    return { message: 'Department deleted successfully' };
  }
};

module.exports = DepartmentModel;
