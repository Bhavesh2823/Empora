const { masterDB } = require('../config/db');
const { createClientDatabase } = require('../utils/dbCreator');
const { createDefaultAdmin } = require('../utils/defaultAdminCreator');
const { encrypt, decrypt, safeDecrypt } = require('../utils/encryption.js');
const { getClientDBConnection } = require('../utils/dbConnector');

const ClientModel = {
  // Check if a client exists based on company name, email, or db name
  // Check if a client exists based on encrypted company name OR encrypted admin email
async clientExists(companyName, email) {
    try {
      const encryptedCompanyName = encrypt(companyName);
      const encryptedAdminEmail = encrypt(email);

      const [existingClient] = await masterDB.query(
        'SELECT * FROM clients WHERE company_name = ? OR admin_email = ?',
        [encryptedCompanyName, encryptedAdminEmail]
      );

      return existingClient.length > 0;
    } catch (error) {
      console.error('❌ Error checking client existence:', error);
      throw error;
    }
  },


  async getNextClientId() {
    try {
      // Fetch the current last client ID from the config table
      const [rows] = await masterDB.query('SELECT last_client_id FROM config WHERE id = 1');
      if (rows.length === 0) {
        throw new Error('Config not found');
      }

      const lastClientId = rows[0].last_client_id;

      // Increment the client ID by 1
      const newClientId = lastClientId + 1;

      // Update the config table with the new last client ID
      await masterDB.query('UPDATE config SET last_client_id = ? WHERE id = 1', [newClientId]);

      return newClientId;
    } catch (error) {
      console.error('❌ Error fetching or updating client ID:', error);
      throw error;
    }
  },

  insertRoles: async function (dbName) {
    const roles = ['superuser', 'admin', 'employee'];

    try {
      const dbConnection = await getClientDBConnection(dbName);

      for (const role of roles) {
        await dbConnection.query('INSERT INTO roles (role_name) VALUES (?)', [role]);
      }

      console.log(`✅ Default roles inserted into ${dbName}.roles table`);
    } catch (error) {
      console.error(`❌ Error inserting roles into ${dbName}:`, error);
      throw error;
    }
  },


  // Create a new client and return the inserted client ID
  async createClient(clientData) {
    const { companyName, email, address, phone, agreementFilePath, status = 'active' } = clientData;

    try {
      // Encrypt sensitive fields before saving
      const encryptedCompanyName = encrypt(companyName);
      const encryptedAdminEmail = encrypt(email);
      const encryptedAddress = encrypt(address);
      const encryptedPhone = encrypt(phone);

      // Get the next client ID (which will be a 3-digit number)
      const clientId = await this.getNextClientId();
      const dbName = `client_db_${clientId}`;
      const encryptedDbName = encrypt(dbName);

      // Insert the new client data into the 'clients' table in the master_control_db
      const [result] = await masterDB.query(
        `INSERT INTO clients (company_name, admin_email, phone, address, db_name, agreement_file_path, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [encryptedCompanyName, encryptedAdminEmail, encryptedPhone, encryptedAddress, encryptedDbName, agreementFilePath || null, status]
      );

      // Now create the client-specific database
      await createClientDatabase(clientId, dbName);
      await createDefaultAdmin(dbName, email, companyName);
      await ClientModel.insertRoles(dbName);

      return { clientId, dbName };
    } catch (error) {
      console.error('❌ Error inserting client:', error);
      throw error;
    }
  },

  async getAllClients() {
    try {
      const [rows] = await masterDB.query('SELECT * FROM clients');
  
      const decryptedClients = rows.map(client => ({
        id: client.id,
        company_name: safeDecrypt(client.company_name),
        admin_email: safeDecrypt(client.admin_email),
        phone: safeDecrypt(client.phone),
        address: safeDecrypt(client.address),
        db_name: safeDecrypt(client.db_name),
        agreement_file_path: client.agreement_file_path,
        status: client.status,
        created_at: client.created_at,
        updated_at: client.updated_at
      }));
  
      return decryptedClients;
    } catch (error) {
      console.error('❌ Error fetching all clients:', error);
      throw error;
    }
  },

  async getClientById(clientId) {
    try {
      const [rows] = await masterDB.query('SELECT * FROM clients WHERE id = ?', [clientId]);
      
      if (rows.length === 0) return null;
  
      const row = rows[0];
  
      return {
        id: row.id,
        company_name: safeDecrypt(row.company_name),
        admin_email: safeDecrypt(row.admin_email),
        phone: safeDecrypt(row.phone),
        address: safeDecrypt(row.address),
        db_name: safeDecrypt(row.db_name),
        agreement_file_path: row.agreement_file_path,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error) {
      console.error('❌ Error fetching client by ID:', error);
      throw error;
    }
  },
  

  // Update a client based on client ID
  async updateClient(clientId, companyName, adminEmail, agreementFilePath, status) {
    try {
      const fields = [];
      const values = [];
  
      if (companyName !== undefined) {
        fields.push('company_name = ?');
        values.push(encrypt(companyName));
      }
  
      if (adminEmail !== undefined) {
        fields.push('admin_email = ?');
        values.push(encrypt(adminEmail));
      }
  
      if (agreementFilePath !== undefined) {
        fields.push('agreement_file_path = ?');
        values.push(agreementFilePath || null); // set null if empty
      }
  
      if (status !== undefined) {
        fields.push('status = ?');
        values.push(status);
      }
  
      if (fields.length === 0) {
        throw new Error('No fields provided to update.');
      }
  
      values.push(clientId); // client id for WHERE clause
  
      const sql = `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`;
  
      await masterDB.query(sql, values);
  
      console.log('✅ Client updated successfully.');
      return true;
    } catch (error) {
      console.error('❌ Error updating client:', error);
      throw error;
    }
  },
  

  // Delete a client based on client ID
  async deleteClient(clientId) {
    try {
      const [result] = await masterDB.query('DELETE FROM clients WHERE id = ?', [clientId]);
  
      if (result.affectedRows === 0) {
        // No client found with this ID
        return { success: false, message: 'Client not found.' };
      }
  
      return { success: true, message: 'Client deleted successfully.' };
    } catch (error) {
      console.error('❌ Error deleting client:', error);
      throw error;
    }
  }
  
};

module.exports = ClientModel;
