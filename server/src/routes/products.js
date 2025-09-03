const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');

// POST /api/products - Create a new product
// Note: You would add authentication middleware here to protect this route
router.post('/', authMiddleware, checkRole(['provider']), productController.createProduct);

router.get('/', productController.getAllProducts);

// GET /api/products/my-products - Get all products for the logged-in provider
router.get('/my-products', authMiddleware, checkRole(['provider']), productController.getProviderProducts);

// GET /api/products/search?q=... - Search for products
router.get('/search', productController.searchProducts);

// GET /api/products/category/:categoryName - Get all products for a category
router.get('/category/:categoryName', productController.getProductsByCategory);

// GET /api/products/:id - Get a single product by its ID
router.get('/:id', productController.getProductById);

// PUT /api/products/:id - Update a product by its ID
router.put('/:id', authMiddleware, productController.updateProduct);

// DELETE /api/products/:id - Delete a product by its ID (Admin only)
router.delete('/:id', authMiddleware, checkRole(['admin', 'provider']), productController.deleteProduct);

module.exports = router;