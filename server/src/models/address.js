const db = require('../config/db');

const Address = {
    /**
     * Creates a new address for a specific user.
     * @param {object} addressData - The address details.
     * @returns {Promise<object>} The result from the database insertion.
     */
    async create(addressData) {
        const { userId, addressType, street, city, state, zipCode, country } = addressData;
        const sql = `
            INSERT INTO addresses (user_id, address_type, street, city, state, zip_code, country)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [userId, addressType, street, city, state, zipCode, country]);
        return result;
    },

    /**
     * Finds all addresses for a specific user.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array>} An array of address objects.
     */
    async findByUserId(userId) {
        const sql = `SELECT * FROM addresses WHERE user_id = ?`;
        const [rows] = await db.query(sql, [userId]);
        return rows;
    }
};

module.exports = Address;