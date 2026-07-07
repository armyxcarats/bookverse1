const express = require('express');

const router = express.Router();


const { addressChart, salesChart, itemsChart } = require('../controllers/dashboard')
const { isAuthenticatedUser, isAdminUser } = require('../middlewares/auth')
router.get('/address-chart', isAuthenticatedUser, isAdminUser, addressChart)
router.get('/sales-chart', isAuthenticatedUser, isAdminUser, salesChart)
router.get('/items-chart', isAuthenticatedUser, isAdminUser, itemsChart)

module.exports = router;




