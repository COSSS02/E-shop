const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist');
const authMiddleware = require('../middleware/auth');

// All wishlist routes are protected
router.use(authMiddleware);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;