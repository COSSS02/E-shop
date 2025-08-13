const Address = require('../models/address');

const addressController = {
    /**
     * Creates a new address for the logged-in user.
     */
    async createAddress(req, res) {
        try {
            const userId = req.user.id;
            const { addressType, street, city, state, zipCode, country } = req.body;

            // Add validation to ensure addressType is provided and is one of the allowed values.
            if (!addressType || !['shipping', 'billing'].includes(addressType)) {
                return res.status(400).json({ message: "A valid address type ('shipping' or 'billing') is required." });
            }

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
    },

    /**
     * (Admin) Get all addresses across the platform.
     */
    async getAllAddresses(req, res) {
        try {
            const rows = await Address.findAllWithUsers();
            res.status(200).json(rows);
        } catch (error) {
            res.status(500).json({ message: "Error fetching addresses", error: error.message });
        }
    },

    /**
     * (Admin) Update an address by ID.
     */
    async updateAddress(req, res) {
        try {
            const { addressId } = req.params;
            await Address.update(addressId, req.body);
            res.status(200).json({ message: "Address updated successfully." });
        } catch (error) {
            res.status(500).json({ message: "Error updating address", error: error.message });
        }
    },

    /**
     * (Admin) Delete an address by ID.
     */
    async deleteAddress(req, res) {
        try {
            const { addressId } = req.params;
            await Address.delete(addressId);
            res.status(200).json({ message: "Address deleted successfully." });
        } catch (error) {
            res.status(500).json({ message: "Error deleting address", error: error.message });
        }
    }
};

module.exports = addressController;