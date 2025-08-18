const Product = require('../models/products');
const Order = require('../models/orders');
const User = require('../models/user');

const dashboardController = {
    async getAdminDashboard(req, res) {
        try {
            const [
                userStats,
                productStats,
                salesStats,
                recentOrders,
                recentUsers
            ] = await Promise.all([
                User.getPlatformStats(),
                Product.getPlatformStats(),
                Order.getPlatformSalesStats(),
                Order.getRecentPlatformOrders(5),
                User.getRecentUsers(5)
            ]);

            res.status(200).json({
                userStats,
                productStats,
                salesStats,
                recentOrders,
                recentUsers
            });
        } catch (error) {
            res.status(500).json({ message: "Error fetching admin dashboard data", error: error.message });
        }
    },

    async getProviderDashboard(req, res) {
        try {
            const providerId = req.user.id;

            // Fetch all dashboard data in parallel for efficiency
            const [
                salesStats,
                lowStockProducts,
                topSellers,
                recentOrders
            ] = await Promise.all([
                Order.getSalesStats(providerId),
                Product.getLowStock(providerId, 5),
                Product.getTopSellers(providerId, 5),
                Order.getRecentOrders(providerId, 5)
            ]);

            res.status(200).json({
                salesStats,
                lowStockProducts,
                topSellers,
                recentOrders
            });

        } catch (error) {
            res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
        }
    }
};

module.exports = dashboardController;