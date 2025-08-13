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
    },

    /**
     * (Admin) Return all addresses with user info.
     */
    async findAllWithUsers() {
        const sql = `
            SELECT
                a.id,
                a.user_id,
                a.address_type,
                a.street,
                a.city,
                a.state,
                a.zip_code,
                a.country,
                u.first_name,
                u.last_name,
                u.email,
                u.role
            FROM addresses a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.id DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    },

    /**
     * (Admin) Update an address (partial).
     */
    async update(id, { addressType, street, city, state, zipCode, country }) {
        const fields = [];
        const params = [];
        if (addressType) { fields.push('address_type = ?'); params.push(addressType); }
        if (street) { fields.push('street = ?'); params.push(street); }
        if (city) { fields.push('city = ?'); params.push(city); }
        if (state) { fields.push('state = ?'); params.push(state); }
        if (zipCode) { fields.push('zip_code = ?'); params.push(zipCode); }
        if (country) { fields.push('country = ?'); params.push(country); }
        if (fields.length === 0) return;
        const sql = `UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`;
        params.push(id);
        await db.query(sql, params);
    },

    /**
     * (Admin) Delete an address.
     */
    async delete(id) {
        await db.query(`DELETE FROM addresses WHERE id = ?`, [id]);
    }
};

module.exports = Address;