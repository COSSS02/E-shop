const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout');
const authMiddleware = require('../middleware/auth');

// All checkout routes should be protected
router.use(authMiddleware);

// Route to create a checkout session
router.post('/create-checkout-session', checkoutController.createCheckoutSession);

// Route to fulfill an order after successful payment
router.post('/fulfill-order', checkoutController.fulfillOrder);

module.exports = router;