const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const authMiddleware = require('../middleware/auth');

// All routes in this file are for authenticated users
router.use(authMiddleware);

// Route to change password
router.patch('/password', userController.changePassword);

// Route to delete the current user's account
router.delete('/me', userController.deleteCurrentUser);

module.exports = router;