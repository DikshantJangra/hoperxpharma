const geminiService = require('../services/ai/geminiService');
const ApiError = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');

/**
 * Gemini AI Controller
 * Handles HTTP requests for the Gemini chatbot
 */
class GeminiController {
    /**
     * POST /api/gemini/chat
     * Main chat endpoint
     */
    async chat(req, res, next) {
        try {
            const { message, sessionId, context } = req.body;

            if (!message || typeof message !== 'string' || !message.trim()) {
                throw ApiError.badRequest('Message is required');
            }

            // Generate session ID if not provided
            const activeSessionId = sessionId || uuidv4();

            // Build context from request
            const chatContext = {
                userRole: req.user?.role || context?.userRole,
                userId: req.user?.id || context?.userId,
                userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : context?.userName,
                storeId: req.user?.storeId || context?.storeId,
                storeName: context?.storeName,
                currentPage: context?.currentPage,
            };

            // Send to Gemini service
            const response = await geminiService.chat(activeSessionId, message, chatContext);

            return res.status(200).json({
                success: response.success,
                sessionId: activeSessionId,
                message: response.message,
                functionCalls: response.functionCalls || [],
                error: response.error,
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/gemini/context
     * Update session context
     */
    async updateContext(req, res, next) {
        try {
            const { sessionId, context } = req.body;

            if (!sessionId) {
                throw ApiError.badRequest('Session ID is required');
            }

            if (!context || typeof context !== 'object') {
                throw ApiError.badRequest('Context object is required');
            }

            geminiService.updateContext(sessionId, context);

            return res.status(200).json({
                success: true,
                message: 'Context updated successfully',
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/gemini/history/:sessionId
     * Get conversation history
     */
    async getHistory(req, res, next) {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                throw ApiError.badRequest('Session ID is required');
            }

            const history = geminiService.getHistory(sessionId);

            return res.status(200).json({
                success: true,
                sessionId,
                history,
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/gemini/session/:sessionId
     * Clear conversation session
     */
    async clearSession(req, res, next) {
        try {
            const { sessionId } = req.params;

            if (!sessionId) {
                throw ApiError.badRequest('Session ID is required');
            }

            geminiService.clearSession(sessionId);

            return res.status(200).json({
                success: true,
                message: 'Session cleared successfully',
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/gemini/prompt/send (Legacy endpoint for compatibility)
     * Simple prompt endpoint without context or sessions
     */
    async sendPrompt(req, res, next) {
        try {
            const { prompt } = req.body;

            if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
                throw ApiError.badRequest('Please send a valid prompt');
            }

            // Use a temporary session
            const tempSessionId = `temp_${Date.now()}`;

            const response = await geminiService.chat(tempSessionId, prompt, {});

            // Clear temp session after response
            geminiService.clearSession(tempSessionId);

            return res.status(200).json({
                success: response.success,
                response: response.message,
                error: response.error,
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GeminiController();
