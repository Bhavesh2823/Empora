const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/client.controller');
const verifySuperuser = require('../middlewares/superuser_auth.middleware');

// Route to create a new client (Superuser only)
router.post('/create-client', verifySuperuser, ClientController.createClient);

// Route to get all clients (Superuser only)
router.get('/get-all-clients', verifySuperuser, ClientController.getAllClients);

// Route to get a client by ID (Superuser only)
router.get('/get-client/:clientId', verifySuperuser, ClientController.getClientById);

// Route to update client (Superuser only)
router.put('/update-client/:clientId', verifySuperuser, ClientController.updateClient);

// Route to delete a client (Superuser only)
router.delete('/delete-client/:clientId', verifySuperuser, ClientController.deleteClient);

module.exports = router;
