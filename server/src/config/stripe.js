const stripe = require('stripe');
require('dotenv').config();

// Initialize Stripe with the secret key from your .env file
const stripeClient = stripe(process.env.STRIPE_SECRET);

module.exports = stripeClient;