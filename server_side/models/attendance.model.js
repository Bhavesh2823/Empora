// models/attendance.model.js

module.exports = (db) => {
  const markCheckIn = async (data) => {
    try {
      const {
        employee_id,
        photo_url,
        latitude,
        longitude,
        status,
        ip_address,
        device_info
      } = data;

      // Add validation for required fields
      if (!employee_id || !photo_url || !latitude || !longitude) {
        console.error('❌ Missing required fields in markCheckIn');
        throw new Error('Missing required fields');
      }

      // Check if we have a proper database connection
      if (!db) {
        console.error('❌ Database connection error - db object is null or undefined');
        throw new Error('Database connection error');
      }

      console.log('Executing SQL query for check-in...');
      
      const query = `
        INSERT INTO attendance 
        (employee_id, photo_url, latitude, longitude, status, ip_address, device_info, check_in_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const params = [employee_id, photo_url, latitude, longitude, status, ip_address, device_info];
      console.log('Parameters:', params);

      // Determine if this is a MySQL2 promise connection
      const isPromiseConnection = db.constructor && db.constructor.name === 'PromiseConnection';
      console.log(`Database connection type: ${isPromiseConnection ? 'MySQL2 Promise' : 'Standard'}`);
      
      if (isPromiseConnection) {
        console.log('Using MySQL2 Promise connection');
        // For MySQL2 promise connections
        const [result] = await db.execute(query, params);
        console.log('✅ Check-in recorded in database:', result);
        return result;
      } else {
        console.log('Using standard connection with callback');
        // For standard connections with callbacks
        return new Promise((resolve, reject) => {
          db.query(query, params, (err, results) => {
            if (err) {
              console.error('❌ Failed to insert check-in data:', err);
              return reject(err);
            }
            console.log('✅ Check-in recorded in database:', results);
            resolve(results);
          });
        });
      }
    } catch (error) {
      console.error('Error in markCheckIn:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const markCheckOut = async (employee_id) => {
    try {
      if (!employee_id) {
        throw new Error('Employee ID is required');
      }

      const query = `
        UPDATE attendance 
        SET check_out_time = NOW(), status = 'present'
        WHERE employee_id = ? AND DATE(check_in_time) = CURDATE()
      `;

      const params = [employee_id];

      // Determine if this is a MySQL2 promise connection
      const isPromiseConnection = db.constructor && db.constructor.name === 'PromiseConnection';
      
      if (isPromiseConnection) {
        // For MySQL2 promise connections
        const [result] = await db.execute(query, params);
        return result;
      } else {
        // For standard connections with callbacks
        return new Promise((resolve, reject) => {
          db.query(query, params, (err, result) => {
            if (err) {
              console.error('DB Update Error:', err);
              return reject(err);
            }
            resolve(result);
          });
        });
      }
    } catch (error) {
      console.error('Error in markCheckOut:', error);
      throw error;
    }
  };

  const getTodayAttendance = async (employee_id) => {
    try {
      if (!employee_id) {
        throw new Error('Employee ID is required');
      }

      const query = `
        SELECT * FROM attendance 
        WHERE employee_id = ? AND DATE(check_in_time) = CURDATE()
      `;

      const params = [employee_id];

      // Determine if this is a MySQL2 promise connection
      const isPromiseConnection = db.constructor && db.constructor.name === 'PromiseConnection';
      
      if (isPromiseConnection) {
        // For MySQL2 promise connections
        const [rows] = await db.execute(query, params);
        return rows && rows.length > 0 ? rows[0] : null;
      } else {
        // For standard connections with callbacks
        return new Promise((resolve, reject) => {
          db.query(query, params, (err, result) => {
            if (err) {
              console.error('DB Select Error:', err);
              return reject(err);
            }
            resolve(result && result.length > 0 ? result[0] : null);
          });
        });
      }
    } catch (error) {
      console.error('Error in getTodayAttendance:', error);
      throw error;
    }
  };

  return {
    markCheckIn,
    markCheckOut,
    getTodayAttendance,
  };
};