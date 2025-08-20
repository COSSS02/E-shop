const User = require('../models/user');
const Address = require('../models/address');
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
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                companyName: user.company_name,
                stripeCustomerId: user.stripe_customer_id
            };

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '12h' } // Token expires in 12 hours
            );

            // Send the token to the client
            res.status(200).json({
                message: "Logged in successfully",
                token: token
            });

        } catch (error) {
            res.status(500).json({ message: "Error logging in", error: error.message });
        }
    },

    /**
     * Handles upgrading a user account to a 'provider' role.
     */
    async upgradeToProvider(req, res) {
        try {
            const userId = req.user.id;
            const { companyName, address } = req.body;

            if (!companyName || !address) {
                return res.status(400).json({ message: "Company name and address are required." });
            }

            // 1. Create the business address for the user
            await Address.create({
                userId,
                addressType: 'provider',
                ...address
            });

            // 2. Update the user's role and company name
            await User.updateRoleAndCompany(userId, 'provider', companyName);

            // Advise user to re-login to get an updated token with the new role
            res.status(200).json({ message: "Account successfully upgraded to provider. Please log out and log back in to access provider features." });

        } catch (error) {
            res.status(500).json({ message: "Error upgrading account", error: error.message });
        }
    }
};

module.exports = authController;