const db = require('../config/db');
const Cart = require('./cart');

function parseMySQLDateTime(s) {
    if (!s) return null;
    if (typeof s === 'string') {
        const normalized = s.includes('T') ? s : s.replace(' ', 'T');
        const d = new Date(normalized);
        return isNaN(d) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
};

function getEffectiveUnitPrice(item) {
    const price = Number(item.price || 0);
    const dprice = Number(item.discount_price || 0);
    const start = parseMySQLDateTime(item.discount_start_date);
    const end = parseMySQLDateTime(item.discount_end_date);
    const now = new Date();
    const active =
        dprice > 0 &&
        start && end &&
        now >= start && now <= end &&
        dprice < price;
    return active ? dprice : price;
};

const Order = {
    async createFromCart(userId, { shippingAddressId, billingAddressId, totalAmount, stripeSessionId }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Get cart items and calculate total
            const cartItems = await Cart.getByUserId(userId);
            if (cartItems.length === 0) throw new Error("Cart is empty.");

            for (const item of cartItems) {
                if (item.quantity > item.stock_quantity) {
                    throw new Error(`Not enough stock for ${item.name}.`);
                }
            }

            const calculatedTotal = cartItems.reduce((sum, item) => {
                const unit = getEffectiveUnitPrice(item);
                return sum + unit * item.quantity;
            }, 0);

            // 3. Create the order with calculated total (avoid trusting client total)
            const orderSql = 'INSERT INTO orders (user_id, shipping_address_id, billing_address_id, total_amount, stripe_session_id) VALUES (?, ?, ?, ?, ?)';
            const [orderResult] = await connection.query(orderSql, [userId, shippingAddressId, billingAddressId, calculatedTotal, stripeSessionId]);
            const orderId = orderResult.insertId;

            // 4. Create order items with price_at_purchase = effective unit price
            const orderItemSql = 'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ?';
            const orderItemsData = cartItems.map(item => {
                const unit = getEffectiveUnitPrice(item);
                return [orderId, item.product_id, item.quantity, unit];
            });
            await connection.query(orderItemSql, [orderItemsData]);

            // 5. Update product stock
            const updateStockSql = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?';
            for (const item of cartItems) {
                await connection.query(updateStockSql, [item.quantity, item.product_id]);
            }

            // 6. Clear the user's cart
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
     * @param {number} user - The user making the request.
     * @param {string} newStatus - The new status to set.
     * @returns {Promise<boolean>} True if the update was successful.
     */
    async updateItemStatus(orderItemId, user, newStatus) {
        let sql;
        let params;

        if (user.role === 'admin') {
            // Admin can update any item status directly
            sql = `UPDATE order_items SET status = ? WHERE id = ?;`;
            params = [newStatus, orderItemId];
        } else if (user.role === 'provider') {
            // Provider must own the product associated with the order item
            sql = `
                UPDATE order_items oi
                JOIN products p ON oi.product_id = p.id
                SET oi.status = ?
                WHERE oi.id = ? AND p.provider_id = ?;
            `;
            params = [newStatus, orderItemId, user.id];
        } else {
            // Other roles are not authorized
            throw new Error("User not authorized to update order status.");
        }

        const [result] = await db.query(sql, params);

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
    },

    /**
     * (Admin) Finds all orders on the platform with searching and pagination.
     */
    async findAll({ limit, offset, sortBy, sortOrder, searchTerm }) {
        const searchPattern = `%${searchTerm}%`;

        const whereClause = `
            WHERE (o.id LIKE ? OR
                   u.email LIKE ? OR
                   CONCAT(u.first_name, ' ', u.last_name) LIKE ?)
        `;
        const searchParams = [searchPattern, searchPattern, searchPattern];

        // Get total count for pagination
        const countSql = `
            SELECT COUNT(o.id) as total
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ${searchTerm ? whereClause : ''}
        `;
        const [[{ total }]] = await db.query(countSql, searchTerm ? searchParams : []);

        // Get paginated orders
        const ordersSql = `
            SELECT
                o.id,
                o.user_id,
                o.total_amount,
                o.created_at,
                u.first_name,
                u.last_name,
                u.email,
                sa.street as shipping_street,
                sa.city as shipping_city
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
            ${searchTerm ? whereClause : ''}
            ORDER BY o.${sortBy} ${sortOrder}
            LIMIT ?
            OFFSET ?;
        `;

        const queryParams = searchTerm ? [...searchParams, limit, offset] : [limit, offset];
        const [orders] = await db.query(ordersSql, queryParams);

        // If no orders are found, return early
        if (orders.length === 0) {
            return { orders: [], totalOrders: total };
        }

        // Fetch all items for the retrieved orders in a single query
        const orderIds = orders.map(o => o.id);
        const itemsSql = `
            SELECT
                oi.id as order_item_id,
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.price_at_purchase,
                oi.status,
                p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id IN (?)
        `;
        const [items] = await db.query(itemsSql, [orderIds]);

        // Map items back to their respective orders
        const ordersWithItems = orders.map(order => ({
            ...order,
            items: items.filter(item => item.order_id === order.id)
        }));

        return { orders: ordersWithItems, totalOrders: total };
    },

    /**
     * (Admin) Gets platform-wide sales statistics.
     */
    async getPlatformSalesStats() {
        const [[sales]] = await db.query(`
            SELECT
                SUM(total_amount) as totalRevenue,
                COUNT(id) as totalOrders
            FROM orders
        `);
        const [[items]] = await db.query(`SELECT SUM(quantity) as totalItemsSold FROM order_items`);
        return { ...sales, ...items };
    },

    /**
     * (Admin) Gets the most recent orders from across the platform.
     */
    async getRecentPlatformOrders(limit = 5) {
        const [orders] = await db.query(`
            SELECT o.id, o.total_amount, o.created_at, u.first_name, u.last_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT ?
        `, [limit]);
        return orders;
    }
};

module.exports = Order;