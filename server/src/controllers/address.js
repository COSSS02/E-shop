const Address = require('../models/address');

const addressController = {
    /**
     * Creates a new address for the logged-in user.
     */
    async createAddress(req, res) {
        try {
            const userId = req.user.id; // Get user ID from the token payload
            const { addressType, street, city, state, zipCode, country } = req.body;

            const result = await Address.create({ userId, addressType, street, city, state, zipCode, country });
            res.status(201).json({ message: "Address created successfully", addressId: result.insertId });
        } catch (error) {
            res.status(500).json({ message: "Error creating address", error: error.message });
        }
    },

    /**
     * Retrieves all addresses for the logged-in user.
     */
    async getMyAddresses(req, res) {
        try {
            const userId = req.user.id; // Get user ID from the token payload
            const addresses = await Address.findByUserId(userId);
            res.status(200).json(addresses);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving addresses", error: error.message });
        }
    }
};

module.exports = addressController;