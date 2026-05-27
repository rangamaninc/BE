// src/routes/taskRoutes.js
const express = require('express');
const CashbookController = require('../controllers/cashbookController');
const OpeningBalanceController = require('../controllers/openingbalanceController')
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new cashbook entry with transactions and subtransactions
router.post('/:clientId/opening-balance', authMiddleware,OpeningBalanceController.createOpeningBalance);
router.post('/:clientId/:cashbook/create', authMiddleware,CashbookController.createCashbook);
router.get('/:clientId/:cashbook', authMiddleware,CashbookController.getCashbookBalancesByYear);


module.exports = router;
