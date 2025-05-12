const ClientModel = require('../models/client.model');
const mysql = require('mysql2');  // Assuming you're using mysql2 for database connection

const ClientController = {
  async createClient(req, res) {
    const { companyName, email, address, phone, agreementFilePath, status = 'active' } = req.body;

    try {
      // Check if client exists before creation
      const clientExists = await ClientModel.clientExists(companyName, email);
      if (clientExists) {
        return res.status(400).json({ message: 'Client already exists.' });
      }

      // Create new client and generate client ID dynamically
      const { clientId, dbName } = await ClientModel.createClient({
        companyName,
        email,
        address,
        phone,
        agreementFilePath,
        status
      });

      res.status(201).json({
        message: 'Client created successfully.',
        dbName
      });
    } catch (err) {
      console.error('Create Client Error:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  async getAllClients(req, res) {
    try {
      const clients = await ClientModel.getAllClients();
      res.status(200).json(clients);
    } catch (err) {
      console.error('Fetch Clients Error:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  async getClientById(req, res) {
    const { clientId } = req.params;
  
    try {
      const client = await ClientModel.getClientById(clientId);
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found.' });
      }
  
      res.status(200).json(client);
    } catch (err) {
      console.error('Fetch Client Error:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },  

  async updateClient(req, res) {
    const { companyName, adminEmail, agreementFilePath, status } = req.body;
    const { clientId } = req.params;

    try {
      await ClientModel.updateClient(clientId, companyName, adminEmail, agreementFilePath, status);
      res.status(200).json({ message: 'Client updated successfully.' });
    } catch (err) {
      console.error('Update Client Error:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  },

  async deleteClient(req, res) {
    try {
      const { clientId } = req.params;
      const result = await ClientModel.deleteClient(clientId);
  
      if (!result.success) {
        return res.status(404).json({ message: result.message });
      }
  
      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error('Delete Client Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = ClientController;