/**
 * Middleware to check if the authenticated user has one of the required roles.
 * This should run AFTER the main authMiddleware.
 * @param {Array<string>} requiredRoles - Array of allowed roles (e.g., ['admin', 'provider']).
 */
function checkRole(requiredRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: "Forbidden: User information not found." });
        }

        if (!requiredRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: You do not have the required permissions." });
        }

        next();
    };
}

module.exports = checkRole;