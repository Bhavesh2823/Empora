const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AdminModel = require('../models/admin.model');

exports.adminLogin = async (req, res) => {
  const { dbName, email, password } = req.body;

  try {
    const admin = await AdminModel.findAdminByEmail(dbName, email);

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
        {
          id: admin.id,
          email,
          role: admin.role,
          dbName, // ✅ Add this line
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      // console.log('Request Params before destructuring in updateEmployee:', req.params); // Log params here for debugging

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email,
        role: admin.role,
      },
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
