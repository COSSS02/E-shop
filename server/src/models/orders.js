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
            SELECT id, total_amount, order_status, created_at
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
    }
};

module.exports = Order;