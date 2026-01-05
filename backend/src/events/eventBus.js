const EventEmitter = require('events');
const logger = require('../config/logger');

/**
 * Event Bus - Central event emitter for cross-service communication
 * Enables event-driven architecture for alerts and other async operations
 */
class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50); // Increase for production

        // Track event history for debugging (last 100 events)
        this.eventHistory = [];
        this.maxHistorySize = 100;

        // Log all events for debugging
        this.on('newListener', (event) => {
            logger.debug(`New listener registered for event: ${event}`);
        });
    }

    /**
     * Emit an event with validation and logging
     * @param {string} eventType - Event type constant from eventTypes.js
     * @param {object} payload - Event data
     */
    emitEvent(eventType, payload) {
        try {
            // Validate payload
            if (!payload || !payload.storeId) {
                logger.warn(`Event ${eventType} emitted without storeId`, payload);
            }

            // Log event
            logger.info(`Event emitted: ${eventType}`, {
                storeId: payload.storeId,
                entityType: payload.entityType,
                entityId: payload.entityId
            });

            // Track in history
            this.addToHistory({
                eventType,
                payload,
                timestamp: new Date()
            });

            // Emit the event
            this.emit(eventType, payload);

            return true;
        } catch (error) {
            logger.error(`Error emitting event ${eventType}:`, error);
            return false;
        }
    }

    /**
     * Add event to history for debugging
     */
    addToHistory(event) {
        this.eventHistory.unshift(event);

        // Keep only last N events
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Get recent event history
     */
    getHistory(limit = 20) {
        return this.eventHistory.slice(0, limit);
    }

    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }
}

// Export singleton instance
module.exports = new EventBus();
