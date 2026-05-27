// src/routes/taskRoutes.js
const express = require('express');
const ClientdataController = require('../controllers/clientdataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new cashbook entry with transactions and subtransactions

router.get('/:clientId/gl-codes', authMiddleware,ClientdataController.getGLCodeMaster);


module.exports = router;
