const User = require('../models/user');

const userController = {
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "Current and new passwords are required." });
            }
            await User.changePassword(req.user.id, currentPassword, newPassword);
            res.status(200).json({ message: "Password changed successfully." });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    async deleteCurrentUser(req, res) {
        try {
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ message: "Password is required for account deletion." });
            }
            await User.delete(req.user.id, password);
            res.status(200).json({ message: "Account deleted successfully." });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = userController;