// src/routes/taskRoutes.js
const express = require('express');
const PrepaidController = require('../controllers/prepaidController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// router.post('/:clientId/opening-balance', authMiddleware,OpeningBalanceController.createOpeningBalance);
// 

router.get('/:clientId',authMiddleware,PrepaidController.getPendingTransactions)

router.post('/:clientId/update-prepaid-details',authMiddleware,PrepaidController.updatePrepaidTxnDetails)

module.exports = router;
