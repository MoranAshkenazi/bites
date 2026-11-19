// Import the MongoDB User model
const User = require('../models/user');

// Import JWT library for token generation
const jwt = require('jsonwebtoken');

const { JWT_SECRET, verifyPassword, hashPassword } = require('../utils/security');


// Create login token
const createToken = async (req, res) => {
     
    try {
        // Extract username and password from the request body
        const { username, password } = req.body;

        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Find the user in MongoDB
        const user = await User.findOne({ username });

        // Validate user and password
        const { valid, needsRehash } = await verifyPassword(password, user && user.password);
        if (!user || !valid) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Upgrade legacy SHA-256 hashes to salted scrypt after a successful login
        if (needsRehash) {
            user.password = await hashPassword(password);
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET
        );

        // Return token and user details to the client
        return res.status(200).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                // profileImage: user.profileImage,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error creating token:', error);
        return res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};

// Export the function so the router can use it
module.exports = {
    createToken
};