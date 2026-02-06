
const EventEmitter = require('events');
const { GSTEngine, GSTEventType } = require('./GSTEngine');
const logger = require('../../config/logger'); // Assuming logger path

class GSTEventBus extends EventEmitter {
    constructor() {
        super();
        this.initializeListeners();
    }

    initializeListeners() {
        // Sale Created -> Process GST
        this.on(GSTEventType.SALE, async (event) => {
            try {
                logger.info(`[GST] Processing Sale Event: ${event.eventId}`);
                await GSTEngine.processSale(event);
                logger.info(`[GST] Processed Sale Event: ${event.eventId}`);
            } catch (error) {
                logger.error(`[GST] Error processing Sale Event: ${event.eventId}`, error);
                // Ensure error limits scope (don't crash app)
            }
        });

        // Purchase Inwarded -> Process GST
        this.on(GSTEventType.PURCHASE, async (event) => {
            try {
                logger.info(`[GST] Processing Purchase Event: ${event.eventId}`);
                await GSTEngine.processPurchase(event);
            } catch (error) {
                logger.error(`[GST] Error processing Purchase Event: ${event.eventId}`, error);
            }
        });
    }

    /**
     * Emit a safe GST event
     * @param {string} type 
     * @param {object} payload 
     */
    emitEvent(type, payload) {
        this.emit(type, payload);
    }
}

// Singleton instance
module.exports = new GSTEventBus();
