const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const dashboardRoutes = require('./src/routes/dashboard');
const addressRoutes = require('./src/routes/address');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/category');
const attributeRoutes = require('./src/routes/attribute');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const wishlistRoutes = require('./src/routes/wishlist');
const checkoutRoutes = require('./src/routes/checkout');
const securityMiddleware = require('./src/middleware/security');

const app = express();
const port = 3000;

app.use(securityMiddleware);

app.use(express.json());

app.use(express.static(path.join(__dirname, '../client/dist')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get("/*splat", (req, res) => {
    console.log("Request received for:", req.url);
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const options = {
    key: fs.readFileSync(path.join(__dirname, './certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './certs/cert.pem'))
};

https.createServer(options, app).listen(port, () => {
    console.log(`HTTPS server running on https://localhost:${port}`);
});