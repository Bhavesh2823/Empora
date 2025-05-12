const { getClientDBConnection } = require('../utils/dbConnector');
const { encrypt } = require('../utils/encryption.js');

exports.findAdminByEmail = async (dbName, email) => {
  const encryptedEmail = encrypt(email);
  const connection = await getClientDBConnection(dbName);

  const [rows] = await connection.execute(
    'SELECT * FROM admins WHERE email = ?',
    [encryptedEmail]
  );

  await connection.end();
  return rows.length > 0 ? rows[0] : null;
};
