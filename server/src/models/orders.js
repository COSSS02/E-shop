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
    }
};

module.exports = Order;