const db = require('../config/db');
const Cart = require('./cart');

const Order = {
    async createFromCart(userId, { shippingAddressId, billingAddressId }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Get cart items and calculate total
            const cartItems = await Cart.getByUserId(userId);
            if (cartItems.length === 0) throw new Error("Cart is empty.");

            let totalAmount = 0;
            for (const item of cartItems) {
                if (item.quantity > item.stock_quantity) {
                    throw new Error(`Not enough stock for ${item.name}. Available: ${item.stock_quantity}, Requested: ${item.quantity}.`);
                }
                totalAmount += item.price * item.quantity;
            }

            // 2. Create the order
            const orderSql = 'INSERT INTO orders (user_id, shipping_address_id, billing_address_id, total_amount) VALUES (?, ?, ?, ?)';
            const [orderResult] = await connection.query(orderSql, [userId, shippingAddressId, billingAddressId, totalAmount]);
            const orderId = orderResult.insertId;

            // 3. Create order items and update product stock
            const orderItemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ?';
            const updateStockSql = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?';

            const orderItemsData = [];
            for (const item of cartItems) {
                orderItemsData.push([orderId, item.product_id, item.quantity, item.price]);
                await connection.query(updateStockSql, [item.quantity, item.product_id]);
            }
            await connection.query(orderItemSql, [orderItemsData]);

            // 4. Clear the user's cart
            await Cart.clear(userId, connection);

            await connection.commit();
            return { orderId, message: "Order placed successfully!" };

        } catch (error) {
            await connection.rollback();
            console.error("Error creating order:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Finds all orders for a specific user, including their items.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array>} An array of order objects, each with an 'items' array.
     */
    async findByUserId(userId) {
        // Get all base orders for the user
        const ordersSql = `
            SELECT id, total_amount, created_at
            FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;
        const [orders] = await db.query(ordersSql, [userId]);

        if (orders.length === 0) {
            return [];
        }

        const orderIds = orders.map(o => o.id);

        // Get all items for all of those orders in one go
        const itemsSql = `
            SELECT
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase,
                oi.status,
                p.name AS product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id IN (?)
        `;
        const [items] = await db.query(itemsSql, [orderIds]);

        // Map items to their respective orders for an efficient join
        const ordersMap = new Map(orders.map(o => [o.id, { ...o, items: [] }]));
        for (const item of items) {
            if (ordersMap.has(item.order_id)) {
                ordersMap.get(item.order_id).items.push(item);
            }
        }

        return Array.from(ordersMap.values());
    },

    /**
     * Finds all order items for a specific provider.
     * @param {number} providerId - The ID of the provider.
     * @returns {Promise<Array>} A list of order items with product and customer details.
     */
    async findItemsByProviderId(providerId) {
        const sql = `
            SELECT
                oi.id AS order_item_id,
                oi.order_id,
                oi.quantity,
                oi.price_at_purchase,
                oi.status,
                p.id AS product_id,
                p.name AS product_name,
                o.created_at,
                u.first_name,
                u.last_name,
                sa.street AS shipping_street,
                sa.city AS shipping_city,
                sa.state AS shipping_state,
                sa.zip_code AS shipping_postal_code,
                sa.country AS shipping_country
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
            WHERE p.provider_id = ?
            ORDER BY o.created_at DESC;
        `;
        const [items] = await db.query(sql, [providerId]);
        return items;
    },

    /**
     * Updates the status of a single order item, ensuring the provider has ownership.
     * @param {number} orderItemId - The ID of the order_items record.
     * @param {number} providerId - The ID of the provider making the request.
     * @param {string} newStatus - The new status to set.
     * @returns {Promise<boolean>} True if the update was successful.
     */
    async updateItemStatus(orderItemId, providerId, newStatus) {
        const sql = `
            UPDATE order_items oi
            JOIN products p ON oi.product_id = p.id
            SET oi.status = ?
            WHERE oi.id = ? AND p.provider_id = ?;
        `;
        const [result] = await db.query(sql, [newStatus, orderItemId, providerId]);

        if (result.affectedRows === 0) {
            // This means the item was not found OR the provider was not authorized.
            throw new Error("Order item not found or you are not authorized to update it.");
        }
        return true;
    },

    /**
     * Calculates sales statistics for a provider.
     * @param {number} providerId - The ID of the provider.
     * @returns {Promise<object>} An object with sales stats.
     */
    async getSalesStats(providerId) {
        const sql = `
            SELECT
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS totalRevenue,
                COUNT(DISTINCT oi.order_id) AS totalOrders,
                COALESCE(SUM(oi.quantity), 0) AS totalItemsSold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE p.provider_id = ? AND oi.status NOT IN ('Cancelled', 'Pending');
        `;
        const [[stats]] = await db.query(sql, [providerId]);
        return stats;
    },

    /**
     * Gets the most recent orders for a provider.
     * @param {number} providerId - The ID of the provider.
     * @param {number} limit - The number of orders to return.
     * @returns {Promise<Array>} A list of recent orders.
     */
    async getRecentOrders(providerId, limit = 5) {
        const sql = `
            SELECT
                o.id as order_id,
                o.created_at,
                SUM(oi.quantity * oi.price_at_purchase) as order_total,
                (SELECT GROUP_CONCAT(p.name SEPARATOR ', ') FROM order_items oi_inner JOIN products p ON oi_inner.product_id = p.id WHERE oi_inner.order_id = o.id AND p.provider_id = ?) as product_names
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE p.provider_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT ?;
        `;
        const [orders] = await db.query(sql, [providerId, providerId, limit]);
        return orders;
    }
};

module.exports = Order;