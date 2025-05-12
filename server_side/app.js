const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

require('dotenv').config({ path: path.resolve(__dirname, '.env') });


const superuserRoutes = require('./routes/superuser.routes');
const clientRoutes = require('./routes/client.routes'); // <-- Import client routes
const adminRoutes = require('./routes/admin.routes');
const employeeRoutes = require('./routes/employee.routes');
const departmentRoutes = require('./routes/department.routes');
const attendanceRoutes = require('./routes/attendance.routes');
require('events').EventEmitter.defaultMaxListeners = 20;

app.use(express.json());



// Routes
app.use('/api/superuser', superuserRoutes);
app.use('/api/clients', clientRoutes); // <-- Mount client routes
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);

console.log("Available Routes:");
app._router.stack.forEach((route) => {
  if (route.route && route.route.path) {
    console.log(route.route.path);
  }
});


// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Empora HR Backend!');
});

module.exports = app;
