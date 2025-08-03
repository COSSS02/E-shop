const Cart = require('../models/cart');

const cartController = {
    async getCart(req, res) {
        try {
            const cartItems = await Cart.getByUserId(req.user.id);
            res.status(200).json(cartItems);
        } catch (error) {
            res.status(500).json({ message: "Error getting cart", error: error.message });
        }
    },
    async addItem(req, res) {
        try {
            const { productId, quantity } = req.body;
            await Cart.addItem(req.user.id, productId, quantity);
            res.status(200).json({ message: "Item added to cart" });
        } catch (error) {
            res.status(500).json({ message: "Error adding item to cart", error: error.message });
        }
    },
    async updateItem(req, res) {
        try {
            const { productId } = req.params;
            const { quantity } = req.body;
            await Cart.updateItemQuantity(req.user.id, productId, quantity);
            res.status(200).json({ message: "Cart item updated" });
        } catch (error) {
            res.status(500).json({ message: "Error updating cart item", error: error.message });
        }
    },
    async removeItem(req, res) {
        try {
            const { productId } = req.params;
            await Cart.removeItem(req.user.id, productId);
            res.status(200).json({ message: "Item removed from cart" });
        } catch (error) {
            res.status(500).json({ message: "Error removing item from cart", error: error.message });
        }
    }
};

module.exports = cartController;