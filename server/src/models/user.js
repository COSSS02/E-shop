const db = require('../config/db');
const bcrypt = require('bcrypt');

const saltRounds = 10; // Standard practice for bcrypt

const User = {
    /**
     * Creates a new user and hashes their password.
     * @param {object} userData - The user's data (email, password, etc.).
     * @returns {Promise<object>} The result from the database insertion.
     */
    async create(userData) {
        const { email, password, firstName, lastName, role, companyName } = userData;

        // Hash the password
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const sql = `
            INSERT INTO users (email, password_hash, first_name, last_name, role, company_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [email, passwordHash, firstName, lastName, role || 'client', companyName || null]);
        return result;
    },

    /**
     * Finds a user by their email address.
     * @param {string} email - The user's email.
     * @returns {Promise<object|null>} The user object or null if not found.
     */
    async findByEmail(email) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await db.query(sql, [email]);

        if (rows.length === 0) {
            return null;
        }

        const user = rows[0];

        // Attach a method to the user object to verify passwords
        user.verifyPassword = async function (password) {
            return await bcrypt.compare(password, this.password_hash);
        };

        return user;
    }
};

module.exports = User;