/**
 * In-memory conversation store for Gemini chat sessions
 * Can be upgraded to Redis or database for production
 */
class ConversationStore {
    constructor() {
        this.sessions = new Map();
        this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

        // Cleanup old sessions every 10 minutes
        setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }

    /**
     * Get conversation history for a session
     */
    getHistory(sessionId) {
        const session = this.sessions.get(sessionId);

        if (!session) {
            return [];
        }

        // Update last accessed time
        session.lastAccessed = Date.now();
        return session.history;
    }

    /**
     * Add message to conversation history
     */
    addMessage(sessionId, role, content) {
        let session = this.sessions.get(sessionId);

        if (!session) {
            session = {
                history: [],
                context: {},
                createdAt: Date.now(),
                lastAccessed: Date.now(),
            };
            this.sessions.set(sessionId, session);
        }

        // Store message WITHOUT timestamp for Gemini API compatibility
        session.history.push({
            role, // 'user' or 'model'
            parts: [{ text: content }],
        });

        session.lastAccessed = Date.now();
    }

    /**
     * Update session context (user role, store, page)
     */
    updateContext(sessionId, context) {
        let session = this.sessions.get(sessionId);

        if (!session) {
            session = {
                history: [],
                context: {},
                createdAt: Date.now(),
                lastAccessed: Date.now(),
            };
            this.sessions.set(sessionId, session);
        }

        session.context = { ...session.context, ...context };
        session.lastAccessed = Date.now();
    }

    /**
     * Get session context
     */
    getContext(sessionId) {
        const session = this.sessions.get(sessionId);
        return session?.context || {};
    }

    /**
     * Clear a session
     */
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }

    /**
     * Cleanup old sessions
     */
    cleanup() {
        const now = Date.now();
        const expiredSessions = [];

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastAccessed > this.SESSION_TIMEOUT) {
                expiredSessions.push(sessionId);
            }
        }

        expiredSessions.forEach(sessionId => this.sessions.delete(sessionId));

        if (expiredSessions.length > 0) {
            console.log(`[ConversationStore] Cleaned up ${expiredSessions.length} expired sessions`);
        }
    }

    /**
     * Get session count (for monitoring)
     */
    getSessionCount() {
        return this.sessions.size;
    }
}

module.exports = new ConversationStore();
