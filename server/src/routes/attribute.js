const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attribute');
const authMiddleware = require('../middleware/auth');

// This route is protected to ensure only logged-in users can see attribute suggestions.
router.get('/category/:categoryId', authMiddleware, attributeController.getAttributesByCategory);

router.post('/filters/category/:categoryName', attributeController.getCategoryFilters);

module.exports = router;