const express = require('express');
const router = express.Router();
const net = require('net');
const jwt = require('jsonwebtoken');
const Restaurant = require('../models/restaurant');
const { JWT_SECRET } = require('../utils/security');

// Address of the C++ recommendation server (same variables as the order gateway)
const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || '127.0.0.1';
const CPP_SERVER_PORT = process.env.CPP_SERVER_PORT || 9000;

// Returns the user ID from a valid "Bearer <token>" header, or null for guests
const getUserIdFromRequest = (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId ? decoded.userId.toString() : null;
    } catch (error) {
        return null;
    }
};

// Sends "recommend <user> <product>" to the C++ server and resolves with the product IDs it returns
const askCppForRecommendations = (userId, productId) => {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let cppResponse = '';

        // The C++ server keeps the connection open after answering, so the reply is read up to the newline
        client.setTimeout(3000, () => {
            client.destroy();
            reject(new Error('C++ recommendation server timed out'));
        });

        client.connect(CPP_SERVER_PORT, CPP_SERVER_HOST, () => {
            client.write(`recommend ${userId} ${productId}\n`);
        });

        client.on('data', (data) => {
            cppResponse += data.toString();
            if (cppResponse.includes('\n')) {
                client.end();
                resolve(cppResponse);
            }
        });

        client.on('error', (err) => reject(err));
    });
};

// GET /api/recommendations?productId=&restaurantId=
// Logged-in users get suggestions based on their order history. Guests get an empty list.
router.get('/', async (req, res) => {
    const { productId, restaurantId } = req.query;

    if (!productId || !restaurantId) {
        return res.status(400).json({ error: 'Missing productId or restaurantId' });
    }

    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return res.json([]);
    }

    try {
        const cppResponse = await askCppForRecommendations(userId, productId);

        // The C++ server answers with a space-separated list of product IDs (empty if there are none)
        const recommendedIds = cppResponse.split(/\s+/).filter(Boolean);

        if (recommendedIds.length === 0) {
            return res.json([]);
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.products) {
            return res.json([]);
        }

        const fullRecommendedProducts = restaurant.products.filter((product) =>
            recommendedIds.includes(product._id.toString())
        );

        return res.json(fullRecommendedProducts);
    } catch (error) {
        console.error('Recommendation request failed:', error.message);
        return res.status(503).json({ error: 'Recommendation server offline' });
    }
});

module.exports = router;
