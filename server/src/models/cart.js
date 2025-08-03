const db = require('../config/db');

const Cart = {
    async getByUserId(userId) {
        const sql = `
            SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.stock_quantity
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?
        `;
        const [items] = await db.query(sql, [userId]);
        return items;
    },

    async addItem(userId, productId, quantity) {
        const sql = `
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `;
        await db.query(sql, [userId, productId, quantity]);
    },

    async updateItemQuantity(userId, productId, quantity) {
        if (quantity <= 0) {
            return this.removeItem(userId, productId);
        }
        const sql = 'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?';
        await db.query(sql, [quantity, userId, productId]);
    },

    async removeItem(userId, productId) {
        const sql = 'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?';
        await db.query(sql, [userId, productId]);
    },

    async clear(userId, connection) {
        // Use the provided connection if in a transaction
        const sql = 'DELETE FROM cart_items WHERE user_id = ?';
        const executor = connection || db;
        await executor.query(sql, [userId]);
    }
};

module.exports = Cart;