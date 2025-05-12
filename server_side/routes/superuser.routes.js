const express = require('express');
const router = express.Router();

const SuperuserController = require('../controllers/superuser.controller');
const verifyToken = require('../middlewares/superuser_auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// Initialize a superuser (Hidden route)
const INIT_SECRET = process.env.SUPERUSER_INIT_SECRET;

// Register a superuser (Only if the correct secret key is provided)
router.post('/init-superuser', (req, res, next) => {
  const secretKey = req.headers['x-super-secret'];

  // Check if the secret key is provided and matches the expected one
  if (secretKey !== INIT_SECRET) {
    return res.status(403).json({ message: 'Unauthorized access. Secret key missing or incorrect.' });
  }

  next();  // Proceed to the registration controller if the secret key is valid
}, SuperuserController.register);

// Login route
router.post('/login', SuperuserController.login);

// Optional: Superuser only route
router.get('/get-superusers', verifyToken, authorizeRoles('superuser'), SuperuserController.getAll);

module.exports = router;
