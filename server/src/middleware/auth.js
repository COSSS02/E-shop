const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token is required.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using the secret from your .env file
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user payload (id, email, role) to the request object
        req.user = decoded;

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
}

module.exports = authMiddleware;