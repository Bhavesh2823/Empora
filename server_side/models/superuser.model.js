const { masterDB } = require('../config/db');

const SuperuserModel = {
  // Find a superuser by email
  async findByEmail(email) {
    const [rows] = await masterDB.query('SELECT * FROM superusers WHERE email = ?', [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  // Create a superuser
  async createSuperuser({ username, email, passwordHash }) {
    await masterDB.query(
      'INSERT INTO superusers (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
  },

  // Get all superusers (Optional)
  async getAll() {
    const [rows] = await masterDB.query('SELECT * FROM superusers');
    return rows;
  }
};

module.exports = SuperuserModel;
