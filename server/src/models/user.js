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
     * Sets the Stripe Customer ID for a given user.
     * @param {number} userId - The ID of the user in your database.
     * @param {string} stripeCustomerId - The customer ID from Stripe.
     */
    async setStripeCustomerId(userId, stripeCustomerId) {
        const sql = 'UPDATE users SET stripe_customer_id = ? WHERE id = ?';
        await db.query(sql, [stripeCustomerId, userId]);
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
    },

    /**
     * Updates a user's role and company name.
     * @param {number} userId - The ID of the user to update.
     * @param {string} role - The new role for the user.
     * @param {string} companyName - The user's company name.
     * @returns {Promise<object>} The result from the database update.
     */
    async updateRoleAndCompany(userId, role, companyName) {
        const sql = `UPDATE users SET role = ?, company_name = ? WHERE id = ?`;
        const [result] = await db.query(sql, [role, companyName, userId]);
        return result;
    },

    /**
     * Changes a user's password after verifying their current one.
     * @param {number} userId - The ID of the user.
     * @param {string} currentPassword - The user's current password.
     * @param {string} newPassword - The new password to set.
     * @returns {Promise<boolean>} True if the password was changed successfully.
     */
    async changePassword(userId, currentPassword, newPassword) {
        const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            throw new Error("User not found.");
        }
        const user = rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            throw new Error("Incorrect current password.");
        }

        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        const updateSql = 'UPDATE users SET password_hash = ? WHERE id = ?';
        await db.query(updateSql, [newPasswordHash, userId]);
        return true;
    },

    /**
     * Deletes a user's account after verifying their password.
     * @param {number} userId - The ID of the user to delete.
     * @param {string} password - The user's password for confirmation.
     * @returns {Promise<boolean>} True if the account was deleted successfully.
     */
    async delete(userId, password) {
        const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            throw new Error("User not found.");
        }
        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error("Incorrect password. Account deletion failed.");
        }

        // Assumes ON DELETE CASCADE is set for related tables (orders, addresses, etc.)
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        return true;
    },

    /**
     * (Admin) Finds all users for the management dashboard.
     */
    async findAll() {
        const sql = `
            SELECT id, first_name, last_name, email, role, company_name, created_at
            FROM users
            ORDER BY created_at DESC;
        `;
        const [users] = await db.query(sql);
        return users;
    },

    /**
     * (Admin) Updates a user's details.
     * @param {number} userId - The ID of the user to update.
     * @param {object} userData - An object with the fields to update.
     */
    async updateUserAsAdmin(userId, { firstName, lastName, email, role, companyName }) {
        const sql = `
            UPDATE users SET
                first_name = ?,
                last_name = ?,
                email = ?,
                role = ?,
                company_name = ?
            WHERE id = ?;
        `;
        await db.query(sql, [firstName, lastName, email, role, companyName, userId]);
    },

    /**
     * (Admin) Deletes a user account by its ID.
     * @param {number} userId - The ID of the user to delete.
     */
    async deleteById(userId) {
        // Assumes ON DELETE CASCADE is set for related tables
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
    },

    /**
     * (Admin) Gets platform-wide user statistics.
     */
    async getPlatformStats() {
        const [rows] = await db.query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`);
        const stats = rows.reduce((acc, row) => {
            acc[`${row.role}s`] = row.count; // e.g., { clients: 10, providers: 5 }
            return acc;
        }, {});
        const [[{ totalUsers }]] = await db.query(`SELECT COUNT(*) as totalUsers FROM users`);
        return { ...stats, totalUsers };
    },

    /**
     * (Admin) Gets the most recently registered users.
     */
    async getRecentUsers(limit = 5) {
        const [users] = await db.query(`
            SELECT id, first_name, last_name, email, role, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit]);
        return users;
    },
};

module.exports = User;