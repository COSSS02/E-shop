const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');


// --- Route Definitions ---

// POST /api/categories - Create a new category (Admin Only)
router.post('/', authMiddleware, checkRole(['admin']), categoryController.createCategory);

// GET /api/categories - Get all categories (Publicly accessible)
router.get('/', categoryController.getAllCategories);

module.exports = router;