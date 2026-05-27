const express = require('express');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const cashbookRoutes = require('./cashbookRoutes')
const clientdataRoutes = require('./clientdataRoutes')
const prepaidRoutes = require('./prepaidRoutes')
const accuralRoutes = require('./accuralRoutes')
const insuranceRoutes = require('./insuranceRoutes')
const reconcileRoutes = require('./reconcileRoutes')
const accountingRoutes = require('./accountingRoutes')
const errorHandler = require('../utils/errorHandler');
const config = require('../config');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/cashbook', cashbookRoutes);
router.use('/clientdata', clientdataRoutes);
router.use('/prepaid', prepaidRoutes);
router.use('/accurals', accuralRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/reconcile', reconcileRoutes);
router.use('/accounting', accountingRoutes);


// Other route modules go here

router.use(errorHandler);

module.exports = router;
