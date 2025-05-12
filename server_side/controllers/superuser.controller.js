const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SuperuserModel = require('../models/superuser.model');

const SuperuserController = {
  // Register a new superuser
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Check if superuser already exists
      const existingUser = await SuperuserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered.' });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      await SuperuserModel.createSuperuser({ username, email, passwordHash });

      res.status(201).json({ message: 'Superuser registered successfully.' });
    } catch (error) {
      console.error('Register Error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  // Login superuser
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await SuperuserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'Superuser not found.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'superuser' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  // Optional: Get all superusers
  async getAll(req, res) {
    try {
      const users = await SuperuserModel.getAll();
      res.status(200).json(users);
    } catch (error) {
      console.error('Fetch Error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
};

module.exports = SuperuserController;
