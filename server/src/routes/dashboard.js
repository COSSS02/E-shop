const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');

// Protect all dashboard routes
router.get('/admin', authMiddleware, checkRole(['admin']), dashboardController.getAdminDashboard);
router.get('/provider', authMiddleware, checkRole(['provider']), dashboardController.getProviderDashboard);

module.exports = router;