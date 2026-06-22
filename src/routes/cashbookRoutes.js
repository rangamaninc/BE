// src/routes/taskRoutes.js
const express = require('express');
const CashbookController = require('../controllers/cashbookController');
const OpeningBalanceController = require('../controllers/openingbalanceController')
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new cashbook entry with transactions and subtransactions
router.get('/:clientId/opening-balance', authMiddleware, OpeningBalanceController.getOpeningBalances);
router.post('/:clientId/opening-balance/post', authMiddleware, OpeningBalanceController.postOpeningBalances);
router.post('/:clientId/opening-balance', authMiddleware, OpeningBalanceController.createOpeningBalance);
router.put('/:clientId/opening-balance/:id', authMiddleware, OpeningBalanceController.updateOpeningBalance);
router.delete('/:clientId/opening-balance/:id', authMiddleware, OpeningBalanceController.deleteOpeningBalance);
router.post('/:clientId/:cashbook/create', authMiddleware,CashbookController.createCashbook);
router.get('/:clientId/:cashbook', authMiddleware,CashbookController.getCashbookBalancesByYear);


module.exports = router;