const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');

// POST /api/products - Create a new product
// Note: You would add authentication middleware here to protect this route
router.post('/', productController.createProduct);

// GET /api/products/:id - Get a single product by its ID
router.get('/:id', productController.getProductById);

module.exports = router;