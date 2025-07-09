const User = require('../models/user');
const jwt = require('jsonwebtoken');

const authController = {
    /**
     * Handles user registration.
     */
    async register(req, res) {
        try {
            const { email, password, firstName, lastName, role, companyName } = req.body;

            // --- NEW SECURITY CHECK ---
            // Prevent anyone from creating an admin account via the public registration endpoint.
            if (role === 'admin') {
                return res.status(403).json({ message: "Forbidden: Cannot create an admin user through this endpoint." });
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: "An account with this email already exists." });
            }

            // Create the user
            const result = await User.create({ email, password, firstName, lastName, role, companyName });
            res.status(201).json({ message: "User registered successfully", userId: result.insertId });

        } catch (error) {
            res.status(500).json({ message: "Error registering user", error: error.message });
        }
    },

    /**
     * Handles user login.
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find the user by email
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ message: "Authentication failed. User not found." });
            }

            // Verify the password
            const isMatch = await user.verifyPassword(password);
            if (!isMatch) {
                return res.status(401).json({ message: "Authentication failed. Wrong password." });
            }

            // Create a JWT
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' } // Token expires in 1 hour
            );

            // Send the token to the client
            res.status(200).json({
                message: "Logged in successfully",
                token: token
            });

        } catch (error) {
            res.status(500).json({ message: "Error logging in", error: error.message });
        }
    }
};

module.exports = authController;