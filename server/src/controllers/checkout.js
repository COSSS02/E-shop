const stripe = require('../config/stripe');
const db = require('../config/db');
const Cart = require('../models/cart');
const User = require('../models/user');
const Order = require('../models/orders');

const checkoutController = {
    async createCheckoutSession(req, res) {
        try {
            const userId = req.user.id;
            const { shippingAddressId, billingAddressId } = req.body;

            if (!shippingAddressId || !billingAddressId) {
                return res.status(400).json({ message: "Shipping and billing addresses are required." });
            }

            const cartItems = await Cart.getByUserId(userId);
            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ message: "Your cart is empty." });
            }

            let stripeCustomerId = await User.getStripeCustomerId(userId);
            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({ email: req.user.email });
                stripeCustomerId = customer.id;
                await User.setStripeCustomerId(userId, stripeCustomerId);
                console.log("Created new Stripe customer:", stripeCustomerId);
            } else {
                console.log("Using existing Stripe customer:", stripeCustomerId);
            }

            const line_items = cartItems.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: { name: item.name },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            }));

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer: stripeCustomerId,
                line_items,
                success_url: `${process.env.CLIENT_URL || 'https://localhost:5173'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL || 'https://localhost:5173'}/cart`,
                // Attach the address IDs to the session's metadata
                metadata: {
                    cart_user_id: userId, // Good practice to store user ID for verification
                    shipping_address_id: shippingAddressId,
                    billing_address_id: billingAddressId,
                },
                payment_intent_data: {
                    setup_future_usage: 'on_session',
                },
            });

            res.status(200).json({ id: session.id });

        } catch (error) {
            console.error("Error creating Stripe checkout session:", error);
            res.status(500).json({ message: "Failed to create checkout session", error: error.message });
        }
    },

    /**
     * Verifies a successful payment and creates the order in the database.
     */
    async fulfillOrder(req, res) {
        try {
            const { sessionId } = req.body;

            // 1. Check if an order for this session already exists
            const [existingOrder] = await db.query('SELECT id FROM orders WHERE stripe_session_id = ?', [sessionId]);
            if (existingOrder.length > 0) {
                // If it exists, the work is done. Return success without trying to re-create it.
                return res.status(200).json({ message: "Order already processed.", orderId: existingOrder[0].id });
            }

            // If no order exists, proceed with creation
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                const { cart_user_id, shipping_address_id, billing_address_id } = session.metadata;

                if (parseInt(cart_user_id, 10) !== req.user.id) {
                    return res.status(403).json({ message: "Forbidden: User mismatch." });
                }

                const result = await Order.createFromCart(
                    cart_user_id,
                    {
                        shippingAddressId: shipping_address_id,
                        billingAddressId: billing_address_id,
                        totalAmount: session.amount_total / 100,
                        stripeSessionId: sessionId // Pass the session ID to be stored
                    }
                );

                res.status(200).json({ message: "Order placed successfully", orderId: result.orderId });
            } else {
                res.status(400).json({ message: "Payment not successful." });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to fulfill order", error: error.message });
        }
    }
};

module.exports = checkoutController;