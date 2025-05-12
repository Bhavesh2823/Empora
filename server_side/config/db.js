const mysql = require('mysql2/promise');
require('dotenv').config();

const masterDB = mysql.createPool({
  host: process.env.MASTER_DB_HOST || 'localhost',
  user: process.env.MASTER_DB_USER || 'root',
  password: process.env.MASTER_DB_PASSWORD || '',
  database: process.env.MASTER_DB_NAME || 'master_control_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = { masterDB };
