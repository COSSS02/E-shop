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
    },

    async getUserOrders(req, res) {
        try {
            const userId = req.user.id;
            const orders = await Order.findByUserId(userId);
            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving orders", error: error.message });
        }
    },

    /**
     * Handles retrieving all order items for the logged-in provider.
     */
    async getProviderOrderItems(req, res) {
        try {
            const providerId = req.user.id;
            const items = await Order.findItemsByProviderId(providerId);
            res.status(200).json(items);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving provider orders", error: error.message });
        }
    },

    /**
     * Handles updating the status of a single order item.
     */
    async updateOrderItemStatus(req, res) {
        try {
            const { orderItemId } = req.params;
            const { status } = req.body;
            const user = req.user;

            const allowedStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!status || !allowedStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status provided." });
            }

            await Order.updateItemStatus(orderItemId, user, status);
            res.status(200).json({ message: `Order item status updated to ${status}` });
        } catch (error) {
            if (error.message.includes("not found or you are not authorized")) {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: "Error updating order item status", error: error.message });
        }
    },

    /**
     * (Admin) Handles retrieving all orders for the admin dashboard.
     */
    async getAllOrders(req, res) {
        try {
            const { page = 1, sort = 'created_at-desc', q = '' } = req.query;
            const limit = 20;
            const offset = (page - 1) * limit;

            let [sortBy, sortOrder] = sort.split('-');
            if (!['id', 'created_at', 'total_amount'].includes(sortBy)) {
                sortBy = 'created_at'; // Default sort column
            }
            if (!['asc', 'desc'].includes(sortOrder)) {
                sortOrder = 'desc';
            }

            const { orders, totalOrders } = await Order.findAll({
                limit, offset, sortBy, sortOrder, searchTerm: q
            });

            res.status(200).json({
                orders,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalOrders / limit),
                    totalItems: totalOrders
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Error retrieving all orders", error: error.message });
        }
    }
};

module.exports = orderController;