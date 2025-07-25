const express = require('express');
const path = require('path');
const db = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const addressRoutes = require('./src/routes/address');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/category');


const app = express();
const port = 3000;

app.use(express.json());

app.get("/api/test-db", async (req, res) => {
    try {
        const [results] = await db.query("SELECT 1 as val");
        res.json({ success: true, message: "Database connection is working!", data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database connection failed.", error: error.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get("/*splat", (req, res) => {
    console.log("Request received for:", req.url);
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});