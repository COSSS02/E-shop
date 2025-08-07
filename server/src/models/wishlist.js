const db = require('../config/db');

const Wishlist = {
    /**
     * Adds a product to a user's wishlist.
     */
    async add(userId, productId) {
        const sql = 'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)';
        await db.query(sql, [userId, productId]);
        return { userId, productId };
    },

    /**
     * Removes a product from a user's wishlist.
     */
    async remove(userId, productId) {
        const sql = 'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?';
        await db.query(sql, [userId, productId]);
        return { userId, productId };
    },

    /**
     * Finds all products in a user's wishlist.
     */
    async findByUserId(userId) {
        const sql = `
            SELECT
                p.id, p.name, p.description, p.price, p.stock_quantity,
                c.name as category_name
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC;
        `;
        const [products] = await db.query(sql, [userId]);
        return products;
    }
};

module.exports = Wishlist;