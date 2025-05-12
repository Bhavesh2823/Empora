// models/employee.model.js

const { getClientDBConnection } = require('../utils/dbConnector');
const { encrypt, safeEncrypt } = require('../utils/encryption.js');

const EmployeeModel = {
  async employeeExists(dbName, email) {
    if (!email) throw new Error('Email is required to check if employee exists.');
    
    const db = await getClientDBConnection(dbName);
    
    // Use safeEncrypt to handle potential issues
    const encryptedEmail = safeEncrypt(email);
    if (encryptedEmail === null) {
      throw new Error('Failed to encrypt email');
    }
    
    const [rows] = await db.execute('SELECT id FROM employees WHERE email = ?', [encryptedEmail]);
    return rows.length > 0;
  },

  async employeeExistsById(dbName, employeeId) {
    const db = await getClientDBConnection(dbName);
    const [rows] = await db.execute('SELECT id FROM employees WHERE id = ?', [employeeId]);
    return rows.length > 0;
  },

  async createEmployee(dbName, data) {
    const db = await getClientDBConnection(dbName);
    const {
      first_name, last_name, email, phone, address,
      profile_picture, status, department_id, role_id,
      hire_date, document_aadhar, document_pan, document_licence
    } = data;

    // Use safeEncrypt for potentially problematic fields
    const encryptedEmail = safeEncrypt(email);
    const encryptedPhone = phone ? safeEncrypt(phone) : null;
    const encryptedAddress = address ? safeEncrypt(address) : null;
    
    if (encryptedEmail === null) {
      throw new Error('Failed to encrypt email');
    }

    const [result] = await db.execute(
      `INSERT INTO employees 
        (first_name, last_name, email, phone, address, profile_picture, status, department_id, role_id, hire_date, document_aadhar, document_pan, document_licence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        encryptedEmail,
        encryptedPhone,
        encryptedAddress,
        profile_picture,
        status,
        department_id,
        role_id,
        hire_date,
        document_aadhar,
        document_pan,
        document_licence
      ]
    );

    return { id: result.insertId, ...data };
  },

  async getAllEmployees(dbName) {
    const db = await getClientDBConnection(dbName);
    const [rows] = await db.execute('SELECT * FROM employees');
    return rows;
  },

  async getEmployeeById(dbName, id) {
    const db = await getClientDBConnection(dbName);
    const [rows] = await db.execute('SELECT * FROM employees WHERE id = ?', [id]);
    return rows[0];
  },

  async updateEmployee(dbName, employeeId, data) {
    const db = await getClientDBConnection(dbName);

    const updates = [];
    const values = [];

    for (const key in data) {
      if (data[key] !== undefined) {
        let value = data[key];
        if (['email', 'phone', 'address'].includes(key) && value !== null) {
          value = safeEncrypt(value);
        }
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update.');
    }

    const updateQuery = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
    values.push(employeeId);

    const [result] = await db.execute(updateQuery, values);
    return { id: employeeId, ...data };
  },

  async deleteEmployee(dbName, employeeId) {
    const db = await getClientDBConnection(dbName);
    const [result] = await db.execute('DELETE FROM employees WHERE id = ?', [employeeId]);
    return result;
  }
};

module.exports = EmployeeModel;