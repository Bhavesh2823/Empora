// utils/dbConnector.js
const mysql = require('mysql2/promise');

async function getClientDBConnection(dbName) {
  if (!dbName) throw new Error('dbName is required');

  const connection = await mysql.createConnection({
    host: process.env.MASTER_DB_HOST,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    database: dbName,
  });

  return connection;
}

module.exports = { getClientDBConnection };
