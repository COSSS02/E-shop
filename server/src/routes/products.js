const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');

// POST /api/products - Create a new product
// Note: You would add authentication middleware here to protect this route
router.post('/', authMiddleware, checkRole(['provider', 'admin']), productController.createProduct);

router.get('/', productController.getAllProducts);

// GET /api/products/search?q=... - Search for products
router.get('/search', productController.searchProducts);

// GET /api/products/category/:categoryName - Get all products for a category
router.get('/category/:categoryName', productController.getProductsByCategory);

// GET /api/products/:id - Get a single product by its ID
router.get('/:id', productController.getProductById);

module.exports = router;