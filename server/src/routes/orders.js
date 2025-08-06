const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orders');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, orderController.createOrder);

router.get('/my-orders', authMiddleware, orderController.getUserOrders);

module.exports = router;