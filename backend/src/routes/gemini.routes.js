const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');
const { authenticate } = require('../middlewares/auth');

/**
 * Gemini AI Routes
 * All routes require authentication
 */

// Main chat endpoint
router.post('/chat', authenticate, geminiController.chat.bind(geminiController));

// Update session context
router.post('/context', authenticate, geminiController.updateContext.bind(geminiController));

// Get conversation history
router.get('/history/:sessionId', authenticate, geminiController.getHistory.bind(geminiController));

// Clear session
router.delete('/session/:sessionId', authenticate, geminiController.clearSession.bind(geminiController));

// Legacy endpoint for simple prompts
router.post('/prompt/send', geminiController.sendPrompt.bind(geminiController));

module.exports = router;
