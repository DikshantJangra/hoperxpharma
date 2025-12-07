const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portal/portalController');
const jwt = require('jsonwebtoken');

// Auth Middleware for Portal
const authenticatePortal = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded.type !== 'PATIENT_PORTAL') {
            throw new Error('Invalid token type');
        }
        req.user = decoded; // { id, storeId, type }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Public
router.post('/verify', portalController.verify);

// Protected
router.get('/prescriptions', authenticatePortal, portalController.getPrescriptions);
router.post('/refill-request', authenticatePortal, portalController.requestRefill);

module.exports = router;
