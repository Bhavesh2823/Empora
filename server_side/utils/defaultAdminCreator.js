const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { encrypt } = require('./encryption.js'); // 🔐 Use universal encrypt function

// Function to create default Admin in newly created client database
async function createDefaultAdmin(dbName, adminEmail, companyName) {
  try {
    // Connect to the new client DB
    const connection = await mysql.createConnection({
      host: process.env.MASTER_DB_HOST,
      user: process.env.MASTER_DB_USER,
      password: process.env.MASTER_DB_PASSWORD,
      database: dbName,
    });

    console.log(`Connected to new client DB: ${dbName}`);

    // 1. Create "admins" table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'superadmin') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log(`Admins table ensured in DB: ${dbName}`);

    // 2. Prepare default admin data
    const defaultName = encrypt(companyName); // 🔐 Encrypt name
    const encryptedEmail = encrypt(adminEmail); // 🔐 Encrypt email
    const defaultPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10); // 🔐 Hashed password (don't encrypt)

    // 3. Insert encrypted admin data
    await connection.query(
      `INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [defaultName, encryptedEmail, hashedPassword, 'admin']
    );

    console.log(`Default admin inserted into DB: ${dbName}`);

    await connection.end();
  } catch (error) {
    console.error('Default Admin Creation Error:', error);
    throw error; // Rethrow to be caught in controller
  }
}

module.exports = { createDefaultAdmin };
