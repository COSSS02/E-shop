const Order = require('../models/orders');

const orderController = {
    async createOrder(req, res) {
        try {
            const { shippingAddressId, billingAddressId } = req.body;
            if (!shippingAddressId || !billingAddressId) {
                return res.status(400).json({ message: "Shipping and billing address IDs are required." });
            }
            const result = await Order.createFromCart(req.user.id, { shippingAddressId, billingAddressId });
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message || "Error creating order" });
        }
    }
};

module.exports = orderController;