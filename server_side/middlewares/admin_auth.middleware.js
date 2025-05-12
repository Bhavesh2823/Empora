// middlewares/admin_auth.middleware.js

const jwt = require('jsonwebtoken');
const { getClientDBConnection } = require('../utils/dbConnector');

const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Set admin info
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    req.dbName = decoded.dbName;

    // Attach the client-specific DB connection
    const clientDB = await getClientDBConnection(decoded.dbName);
    req.dbConnection = clientDB;

    next();
  } catch (err) {
    console.error('JWT verification or DB attach error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyAdmin;
