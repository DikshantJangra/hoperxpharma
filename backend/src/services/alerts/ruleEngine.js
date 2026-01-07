const { ALL_RULES } = require('../../config/alertRules');
const logger = require('../../config/logger');

/**
 * Rule Engine - Evaluates events against alert rules
 * Determines when alerts should be created and with what properties
 */
class RuleEngine {
    constructor() {
        this.rules = ALL_RULES;
        logger.info(`Rule Engine initialized with ${this.rules.length} rules`);
    }

    /**
     * Process an event and return alert configurations
     * @param {object} event - Event object with eventType and payload
     * @returns {array} Array of alert configurations to create
     */
    async processEvent(event) {
        const { eventType, payload } = event;

        if (!eventType || !payload) {
            logger.warn('Invalid event passed to rule engine', event);
            return [];
        }

        // Find all rules that match this event type
        const matchingRules = this.rules.filter(rule =>
            rule.eventType === eventType && rule.enabled
        );

        if (matchingRules.length === 0) {
            logger.debug(`No alert rules found for event: ${eventType}`);
            return [];
        }

        const alertConfigs = [];

        // Evaluate each matching rule
        for (const rule of matchingRules) {
            try {
                // Check if condition is met
                const conditionMet = await this.evaluateCondition(rule.condition, payload);

                if (!conditionMet) {
                    logger.debug(`Rule ${rule.id} condition not met for event ${eventType}`);
                    continue;
                }

                // Build alert configuration
                const alertConfig = {
                    // Store and entity reference
                    storeId: payload.storeId,
                    relatedType: payload.entityType,
                    relatedId: payload.entityId,

                    // Classification
                    category: rule.category,
                    priority: this.resolveDynamic(rule.priority, payload),
                    severity: this.mapPriorityToSeverity(this.resolveDynamic(rule.priority, payload)),

                    // Content
                    title: this.resolveDynamic(rule.title, payload),
                    description: this.resolveDynamic(rule.message, payload),
                    source: `rule:${rule.id}`,

                    // Type (backward compatibility)
                    type: rule.category.toLowerCase(),

                    // Actions
                    actionLabel: rule.actionLabel,
                    actionUrl: this.resolveDynamic(rule.actionUrl, payload),
                    blockAction: rule.blockAction || false,

                    // Channels
                    channels: rule.channels || ['IN_APP'],

                    // Metadata for context
                    metadata: {
                        eventType,
                        ruleId: rule.id,
                        payload: this.sanitizePayload(payload),
                        triggeredAt: new Date().toISOString(),
                    },

                    // De-duplication info
                    deduplicationWindow: rule.deduplicationWindow,
                };

                alertConfigs.push(alertConfig);

                logger.debug(`Rule ${rule.id} matched for event ${eventType}`, {
                    storeId: payload.storeId,
                    priority: alertConfig.priority,
                });

            } catch (error) {
                logger.error(`Error processing rule ${rule.id}:`, error);
                // Continue processing other rules
            }
        }

        return alertConfigs;
    }

    /**
     * Evaluate rule condition (can be boolean or function)
     */
    async evaluateCondition(condition, payload) {
        if (typeof condition === 'boolean') {
            return condition;
        }

        if (typeof condition === 'function') {
            try {
                const result = await condition(payload);
                return Boolean(result);
            } catch (error) {
                logger.error('Error evaluating condition:', error);
                return false;
            }
        }

        return false;
    }

    /**
     * Resolve dynamic values (can be static value or function)
     */
    resolveDynamic(value, payload) {
        if (typeof value === 'function') {
            try {
                return value(payload);
            } catch (error) {
                logger.error('Error resolving dynamic value:', error);
                return null;
            }
        }

        return value;
    }

    /**
     * Map priority to severity for backward compatibility
     */
    mapPriorityToSeverity(priority) {
        const map = {
            'CRITICAL': 'CRITICAL',
            'HIGH': 'WARNING',
            'MEDIUM': 'INFO',
            'LOW': 'INFO',
        };

        return map[priority] || 'INFO';
    }

    /**
     * Sanitize payload to remove sensitive data before storing in metadata
     */
    sanitizePayload(payload) {
        // Create a shallow copy
        const sanitized = { ...payload };

        // Remove sensitive fields if present
        delete sanitized.password;
        delete sanitized.passwordHash;
        delete sanitized.token;

        return sanitized;
    }

    /**
     * Get all active rules
     */
    getActiveRules() {
        return this.rules.filter(rule => rule.enabled);
    }

    /**
     * Get rules by category
     */
    getRulesByCategory(category) {
        return this.rules.filter(rule =>
            rule.category === category && rule.enabled
        );
    }

    /**
     * Get rule by ID
     */
    getRuleById(ruleId) {
        return this.rules.find(rule => rule.id === ruleId);
    }
}

module.exports = new RuleEngine();
