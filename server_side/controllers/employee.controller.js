// controllers/employee.controller.js

const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const EmployeeModel = require('../models/employee.model');
const { decrypt, safeDecrypt } = require('../utils/encryption.js');

// Utility to decrypt certain fields
function decryptEmployeeFields(employee) {
  if (!employee) return null;
  
  return {
    ...employee,
    email: safeDecrypt(employee.email),
    phone: employee.phone ? safeDecrypt(employee.phone) : null,
    address: employee.address ? safeDecrypt(employee.address) : null,
  };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(__dirname, '../uploads');
      ensureDir(uploadDir); // Make sure base upload directory exists
      
      console.log('Upload directory:', uploadDir);
      
      const form = new formidable.IncomingForm({
        multiples: false,
        uploadDir,
        keepExtensions: true,
        allowEmptyFiles: false, // Changed to false - reject empty files
        maxFileSize: 10 * 1024 * 1024,
      });

      form.on('error', (err) => {
        console.error("Form error:", err);
        reject(err);
      });

      // Create an object to store file paths
      const filePaths = {};

      // Log when we receive a file
      form.on('file', (formName, file) => {
        // Store file path for later use
        filePaths[formName] = file.filepath;
        
        console.log(`File received: ${formName}`, {
          originalFilename: file.originalFilename,
          filepath: file.filepath,
          size: file.size,
          mimetype: file.mimetype
        });
      });

      form.on('fileBegin', (formName, file) => {
        try {
          console.log(`File upload beginning: ${formName}`, {
            originalFilename: file.originalFilename || 'unnamed'
          });
          
          if (!file.originalFilename || file.originalFilename.trim() === '') {
            console.log('Empty file detected, skipping file handling');
            return;
          }
          
          let folder = 'others';
          if (formName === 'profile_picture') folder = 'profile_pictures';
          else if (formName === 'document_Aadhar') folder = 'documents/Aadhar';
          else if (formName === 'document_PAN') folder = 'documents/PAN';
          else if (formName === 'document_Licence') folder = 'documents/Licence';

          const targetDir = path.join(uploadDir, folder);
          ensureDir(targetDir);
          const fileName = `${Date.now()}-${file.originalFilename || 'unnamed'}`;
          file.filepath = path.join(targetDir, fileName);
          
          console.log(`Setting file path to: ${file.filepath}`);
        } catch (err) {
          console.error("Error in fileBegin:", err);
          reject(err);
        }
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Form parse error:", err);
          return reject(err);
        }
        
        // Log files object to see what's being received
        console.log("Files received in form.parse:", Object.keys(files));
        
        // Create a new files object with correct paths from our stored filePaths
        const processedFiles = {};
        for (const key in files) {
          console.log(`File details for ${key}:`, {
            filepath: filePaths[key] || 'Path not found',
            // Include other properties as needed, but we mainly need the filepath
            size: files[key].size,
            originalFilename: files[key].originalFilename
          });
          
          // Use our stored file paths
          processedFiles[key] = {
            ...files[key],
            filepath: filePaths[key] || null
          };
        }
        
        // Convert fields to proper format
        const processedFields = {};
        for (const key in fields) {
          // Handle fields that might be arrays (from formidable)
          if (Array.isArray(fields[key])) {
            processedFields[key] = fields[key][0];
          } else {
            processedFields[key] = fields[key];
          }
        }
        
        resolve({ fields: processedFields, files: processedFiles });
      });
    } catch (err) {
      console.error("Unexpected error in parseForm:", err);
      reject(err);
    }
  });
}

const EmployeeController = {
  async createEmployee(req, res) {
    try {
      if (!req.dbName) {
        return res.status(400).json({ message: 'Database name is missing.' });
      }

      const dbName = req.dbName;
      console.log("Creating employee in database:", dbName);
      console.log("Request content-type:", req.headers['content-type']); // Log content-type
      
      let formData;
      try {
        formData = await parseForm(req);
      } catch (formErr) {
        console.error("Form parsing error:", formErr);
        return res.status(400).json({ message: 'Error parsing form data.', error: formErr.message });
      }
      
      const { fields, files } = formData;
      console.log("Form fields received:", Object.keys(fields));
      console.log("Files received after parsing:", Object.keys(files));

      // Check required fields
      if (!fields.email) {
        return res.status(400).json({ message: 'Email is required.' });
      }

      // Check if employee already exists
      try {
        const employeeExists = await EmployeeModel.employeeExists(dbName, fields.email);
        if (employeeExists) {
          return res.status(400).json({ message: 'Employee with this email already exists.' });
        }
      } catch (checkErr) {
        console.error("Error checking if employee exists:", checkErr);
        return res.status(500).json({ message: 'Database error when checking email.', error: checkErr.message });
      }

      // Prepare employee data with better filepath handling
      const employeeData = {
        first_name: fields.first_name || '',
        last_name: fields.last_name || '',
        email: fields.email,
        phone: fields.phone || null,
        address: fields.address || null,
        department_id: fields.department_id || null,
        role_id: fields.role_id || null,
        hire_date: fields.hire_date || null,
        status: fields.status || 'active',
        // Use direct filepath access from our fixed files object
        profile_picture: files.profile_picture ? files.profile_picture.filepath : null,
        document_aadhar: files.document_Aadhar ? files.document_Aadhar.filepath : null,
        document_pan: files.document_PAN ? files.document_PAN.filepath : null,
        document_licence: files.document_Licence ? files.document_Licence.filepath : null,
      };

      console.log("Employee data being saved:", {
        ...employeeData,
        // Only log status of paths for security
        profile_picture: employeeData.profile_picture ? 'Set' : 'Not set',
        document_aadhar: employeeData.document_aadhar ? 'Set' : 'Not set',
        document_pan: employeeData.document_pan ? 'Set' : 'Not set',
        document_licence: employeeData.document_licence ? 'Set' : 'Not set'
      });

      // Create employee
      try {
        const employee = await EmployeeModel.createEmployee(dbName, employeeData);
        return res.status(201).json({ message: 'Employee created successfully.', employee });
      } catch (createErr) {
        console.error("Error creating employee in database:", createErr);
        return res.status(500).json({ message: 'Database error when creating employee.', error: createErr.message });
      }
    } catch (err) {
      console.error('Unexpected error in createEmployee:', err);
      return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
  },

  async getAllEmployees(req, res) {
    try {
      if (!req.dbName) {
        return res.status(400).json({ message: 'Database name is missing.' });
      }
      
      const dbName = req.dbName;
      const employees = await EmployeeModel.getAllEmployees(dbName);
      const decrypted = employees.map(decryptEmployeeFields);
      return res.status(200).json(decrypted);
    } catch (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
  },

  async getEmployeeById(req, res) {
    try {
      if (!req.dbName) {
        return res.status(400).json({ message: 'Database name is missing.' });
      }
      
      const dbName = req.dbName;
      const { employeeId } = req.params;
      
      const employee = await EmployeeModel.getEmployeeById(dbName, employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found.' });
      }
      
      return res.status(200).json(decryptEmployeeFields(employee));
    } catch (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
  },

  async updateEmployee(req, res) {
    try {
      if (!req.dbName) {
        return res.status(400).json({ message: 'Database name is missing.' });
      }
      
      const dbName = req.dbName;
      const employeeId = req.params.employeeId;
      console.log("Request content-type for update:", req.headers['content-type']); 

      let formData;
      try {
        formData = await parseForm(req);
      } catch (formErr) {
        console.error("Form parsing error:", formErr);
        return res.status(400).json({ message: 'Error parsing form data.', error: formErr.message });
      }
      
      const { fields, files } = formData;
      console.log("Form fields for update:", Object.keys(fields));
      console.log("Files received for update:", Object.keys(files));

      // Check if employee exists
      try {
        const employeeExists = await EmployeeModel.employeeExistsById(dbName, employeeId);
        if (!employeeExists) {
          return res.status(404).json({ message: 'Employee not found.' });
        }
      } catch (checkErr) {
        console.error("Error checking if employee exists:", checkErr);
        return res.status(500).json({ message: 'Database error when checking employee.', error: checkErr.message });
      }

      // Prepare update data
      const updatedData = {};
      
      // Only include fields that are actually provided
      if (fields.first_name !== undefined) updatedData.first_name = fields.first_name;
      if (fields.last_name !== undefined) updatedData.last_name = fields.last_name;
      if (fields.email !== undefined) updatedData.email = fields.email;
      if (fields.phone !== undefined) updatedData.phone = fields.phone;
      if (fields.address !== undefined) updatedData.address = fields.address;
      if (fields.department_id !== undefined) updatedData.department_id = fields.department_id;
      if (fields.role_id !== undefined) updatedData.role_id = fields.role_id;
      if (fields.hire_date !== undefined) updatedData.hire_date = fields.hire_date;
      if (fields.status !== undefined) updatedData.status = fields.status;

      // Only update file paths if new files were uploaded
      if (files.profile_picture && files.profile_picture.filepath) {
        updatedData.profile_picture = files.profile_picture.filepath;
      }
      
      if (files.document_Aadhar && files.document_Aadhar.filepath) {
        updatedData.document_aadhar = files.document_Aadhar.filepath;
      }
      
      if (files.document_PAN && files.document_PAN.filepath) {
        updatedData.document_pan = files.document_PAN.filepath;
      }
      
      if (files.document_Licence && files.document_Licence.filepath) {
        updatedData.document_licence = files.document_Licence.filepath;
      }

      console.log("Update data being saved:", {
        ...updatedData,
        // Only log first part of paths for security
        profile_picture: updatedData.profile_picture ? 'Set' : 'Not set',
        document_aadhar: updatedData.document_aadhar ? 'Set' : 'Not set',
        document_pan: updatedData.document_pan ? 'Set' : 'Not set',
        document_licence: updatedData.document_licence ? 'Set' : 'Not set'
      });

      // Update employee
      try {
        const updatedEmployee = await EmployeeModel.updateEmployee(dbName, employeeId, updatedData);
        return res.status(200).json({ message: 'Employee updated successfully.', employee: updatedEmployee });
      } catch (updateErr) {
        console.error("Error updating employee in database:", updateErr);
        return res.status(500).json({ message: 'Database error when updating employee.', error: updateErr.message });
      }
    } catch (err) {
      console.error('Unexpected error in updateEmployee:', err);
      return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
  },

  async deleteEmployee(req, res) {
    try {
      if (!req.dbName) {
        return res.status(400).json({ message: 'Database name is missing.' });
      }
      
      const dbName = req.dbName;
      const { employeeId } = req.params;
      
      const result = await EmployeeModel.deleteEmployee(dbName, employeeId);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Employee not found.' });
      }
      
      return res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
  }
};

module.exports = EmployeeController;