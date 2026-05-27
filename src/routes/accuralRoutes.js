// src/routes/taskRoutes.js
const express = require('express');
const AccuralController = require('../controllers/AccuralController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// router.post('/:clientId/opening-balance', authMiddleware,OpeningBalanceController.createOpeningBalance);
// 

router.post('/:clientId',authMiddleware,AccuralController.addAcuuralData)

module.exports = router;
