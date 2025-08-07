const Wishlist = require('../models/wishlist');

const wishlistController = {
    async getWishlist(req, res) {
        try {
            const products = await Wishlist.findByUserId(req.user.id);
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: "Error fetching wishlist", error: error.message });
        }
    },

    async addToWishlist(req, res) {
        try {
            const { productId } = req.body;
            await Wishlist.add(req.user.id, productId);
            res.status(201).json({ message: "Product added to wishlist" });
        } catch (error) {
            res.status(500).json({ message: "Error adding to wishlist", error: error.message });
        }
    },

    async removeFromWishlist(req, res) {
        try {
            const { productId } = req.params;
            await Wishlist.remove(req.user.id, productId);
            res.status(200).json({ message: "Product removed from wishlist" });
        } catch (error) {
            res.status(500).json({ message: "Error removing from wishlist", error: error.message });
        }
    }
};

module.exports = wishlistController;