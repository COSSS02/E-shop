const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orders');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');

// All routes require authentication
router.use(authMiddleware);

// --- User-facing routes ---
router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);

// --- Provider-facing routes ---
router.get('/provider', checkRole(['provider']), orderController.getProviderOrderItems);
router.patch('/items/:orderItemId', checkRole(['provider', 'admin']), orderController.updateOrderItemStatus);

// --- Admin-facing routes ---
router.get('/all', checkRole(['admin']), orderController.getAllOrders);

module.exports = router;