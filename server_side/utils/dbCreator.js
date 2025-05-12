const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');
const { MASTER_DB_HOST, MASTER_DB_USER, MASTER_DB_PASSWORD } = process.env;

const createClientDatabase = async (clientId, companyName) => {
  const dbName = `client_db_${clientId}`;

  try {
    const connection = await mysql.createConnection({
      host: MASTER_DB_HOST,
      user: MASTER_DB_USER,
      password: MASTER_DB_PASSWORD,
      multipleStatements: true, // Important: Allow multiple queries
    });

    // 1. Create new database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

    // 2. Verify database creation
    const [rows] = await connection.query(`SHOW DATABASES LIKE ?`, [dbName]);
    if (rows.length === 0) {
      throw new Error(`Database '${dbName}' was not created.`);
    }

    console.log(`✅ Database '${dbName}' verified.`);

    // 3. Switch to the new database and create tables
    await connection.changeUser({ database: dbName });

    // Create necessary tables inside the client database
    await connection.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(255),
        address TEXT,
        profile_picture VARCHAR(255),
        status ENUM('active', 'resigned', 'terminated') DEFAULT 'active',
        department_id INT,
        role_id INT,
        hire_date DATE,
        termination_date DATE,
        document_aadhar VARCHAR(255),
        document_pan VARCHAR(255),
        document_licence VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        check_out_time DATETIME NULL,
        photo_url VARCHAR(255) NOT NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        status ENUM('present', 'late', 'absent') DEFAULT 'present',
        ip_address VARCHAR(50),
        device_info VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        leave_type ENUM('casual', 'sick', 'earned') NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        half_day BOOLEAN DEFAULT FALSE,
        reason TEXT,
        rejection_reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      );


      CREATE TABLE IF NOT EXISTS leave_balances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        casual_leave INT DEFAULT 10,
        sick_leave INT DEFAULT 8,
        earned_leave INT DEFAULT 5,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      );

    `);

    console.log(`✅ Tables created successfully inside '${dbName}'.`);

    await connection.end();
    console.log(`🎯 Client setup done for '${companyName}'.`);

    // Now you can perform the insert operation for the client-specific database

    // Create a new connection for inserting data
    const clientConnection = await mysql.createConnection({
      host: MASTER_DB_HOST,
      user: MASTER_DB_USER,
      password: MASTER_DB_PASSWORD,
      database: dbName, // Switch to client-specific database
    });

    // Now, insert data into the client-specific 'departments' table
    // if (departments.length > 0) {
    //   const values = departments.map(dept => [dept]);
    //   await clientConnection.query(
    //     `INSERT INTO departments (department_name) VALUES ?`,
    //     [values]
    //   );
    //   console.log(`✅ Inserted ${departments.length} departments into '${dbName}'.`);
    // } else {
    //   console.log(`ℹ️ No departments to insert for '${dbName}'.`);
    // }

    await clientConnection.end();
  } catch (error) {
    console.error('❌ Database Creation Error:', error);
    throw error;
  }
};


module.exports = { createClientDatabase };