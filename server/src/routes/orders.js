const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orders');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');

router.post('/', authMiddleware, orderController.createOrder);

// GET /api/orders/my-orders - Get all orders for the logged-in user
router.get('/my-orders', authMiddleware, orderController.getUserOrders);

// GET /api/orders/provider - Get all order items for the logged-in provider
router.get('/provider', authMiddleware, checkRole(['provider']), orderController.getProviderOrderItems);

// PATCH /api/orders/items/:itemId - Update the status of a specific order item
router.patch('/items/:itemId', authMiddleware, checkRole(['provider']), orderController.updateOrderItemStatus);

module.exports = router;