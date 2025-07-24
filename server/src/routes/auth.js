const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// PUT /api/auth/upgrade-to-provider - Upgrade user role
router.put('/upgrade-to-provider', authMiddleware, authController.upgradeToProvider);

module.exports = router;