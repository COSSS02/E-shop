const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address');
const authMiddleware = require('../middleware/auth');

// Apply the authentication middleware to all routes in this file.
// No one can access these routes without a valid token.
router.use(authMiddleware);

// POST /api/addresses - Create a new address for the logged-in user
router.post('/', addressController.createAddress);

// GET /api/addresses - Get all addresses for the logged-in user
router.get('/', addressController.getMyAddresses);

module.exports = router;