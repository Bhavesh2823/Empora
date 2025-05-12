// controllers/attendance.controller.js

const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const Attendance = require('../models/attendance.model');
const { getClientDBConnection } = require('../utils/dbConnector');

// Create folder if not exists
const uploadsDir = path.join(__dirname, '../uploads/attendance_photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const checkIn = async (req, res) => {
  try {
    console.log('Check-in API called');
    
    // Verify database connection before proceeding
    const dbName = req.dbName;
    const clientDB = req.dbConnection;

    if (!dbName || !clientDB) {
      console.error('❌ Database context missing:', { dbName, clientDBExists: !!clientDB });
      return res.status(500).json({ message: 'Database context missing' });
    }

    // Use formidable to parse the multipart form data
    const form = new formidable.IncomingForm({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      multiples: false,
    });

    // Parse the form
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('❌ Error parsing form:', err);
        return res.status(400).json({ message: `Form parsing error: ${err.message}` });
      }

      console.log('Fields received:', JSON.stringify(fields));
      console.log('Files received:', files ? Object.keys(files).length : 0, 'files');

      // Validate required fields
      const employee_id = fields.employee_id?.[0]?.trim();
      const latitude = fields.latitude?.[0]?.trim();
      const longitude = fields.longitude?.[0]?.trim();
      const ip_address = fields.ip_address?.[0]?.trim() || req.ip;
      const device_info = fields.device_info?.[0]?.trim() || req.headers['user-agent'];
      const status = 'pending';

      const missingFields = [];
      if (!employee_id) missingFields.push('employee_id');
      if (!latitude) missingFields.push('latitude');
      if (!longitude) missingFields.push('longitude');
      if (!files.photo || !files.photo[0]) missingFields.push('photo');

      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          received: {
            fields: Object.keys(fields),
            files: files ? Object.keys(files) : []
          }
        });
      }

      const photo = files.photo[0];
      const photo_url = `/uploads/attendance_photos/${photo.newFilename}`;

      const attendanceData = {
        employee_id,
        latitude,
        longitude,
        ip_address,
        device_info,
        status,
        photo_url,
      };

      try {
        console.log('✅ Saving attendance data to database...');
        const result = await Attendance(clientDB).markCheckIn(attendanceData);
        console.log('✅ Check-in successful:', result);
        return res.status(200).json({ message: 'Check-in successful', result });
      } catch (dbErr) {
        console.error('❌ Database insert error:', dbErr);
        return res.status(500).json({ message: `Failed to record attendance: ${dbErr.message}` });
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in checkIn controller:', error);
    return res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

const checkOut = async (req, res) => {
  try {
    const { employee_id } = req.body;
    
    if (!employee_id) {
      return res.status(400).json({ message: 'Employee.. ID is required' });
    }
    
    const result = await Attendance(req.dbConnection).markCheckOut(employee_id);
    return res.status(200).json({ message: 'Check-out successful', result });
  } catch (error) {
    console.error('Check-out Error:', error);
    return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

const getToday = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    if (!employee_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    
    const result = await Attendance(req.dbConnection).getTodayAttendance(employee_id);
    return res.status(200).json({ data: result || null });
  } catch (error) {
    console.error('Get Today Attendance Error:', error);
    return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getToday,
};