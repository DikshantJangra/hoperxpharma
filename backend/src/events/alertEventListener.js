const eventBus = require('./eventBus');
const alertService = require('../services/alertService');
const logger = require('../config/logger');
const { INVENTORY_EVENTS, AUTH_EVENTS } = require('./eventTypes');

/**
 * Alert Event Listener - Connects event system to alert creation
 * Listens for events and creates alerts based on configured rules
 */
class AlertEventListener {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize event listeners
     * Call this once during app startup
     */
    initialize() {
        if (this.initialized) {
            logger.warn('Alert event listener already initialized');
            return;
        }

        // Register listeners for all event types
        this.setupListeners();

        this.initialized = true;
        logger.info('Alert event listener initialized');
    }

    /**
     * Setup event listeners for all alert-triggering events
     */
    setupListeners() {
        // Get all event types from eventTypes.js
        const allEvents = [
            ...Object.values(INVENTORY_EVENTS),
            ...Object.values(AUTH_EVENTS),
        ];

        logger.info(`Registering alert listeners for ${allEvents.length} event types`);

        // Register listener for each event type
        allEvents.forEach(eventType => {
            eventBus.on(eventType, async (payload) => {
                try {
                    logger.debug(`[AlertListener] Processing event: ${eventType}`);

                    // Create alert from event (awaited to catch errors)
                    const result = await alertService.createAlertFromEvent({
                        eventType,
                        payload,
                    });

                    if (result) {
                        logger.debug(`[AlertListener] Alert created successfully for ${eventType}`);
                    }
                } catch (error) {
                    logger.error(`[AlertListener] Error creating alert for event ${eventType}:`, error);
                }
            });
        });

        logger.info(`✅ Alert event listeners registered for ${allEvents.length} event types`);
    }
}

module.exports = new AlertEventListener();
