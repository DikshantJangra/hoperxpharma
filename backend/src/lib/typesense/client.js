"use strict";
/**
 * Typesense Client Configuration
 *
 * This module provides a configured Typesense client for medicine search operations.
 * Typesense is used as the search engine for fast, fuzzy, and prefix-based medicine searches.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typesenseConfig = exports.typesenseClient = void 0;
exports.checkTypesenseHealth = checkTypesenseHealth;
exports.getTypesenseMetrics = getTypesenseMetrics;
const typesense_1 = __importDefault(require("typesense"));
// Typesense configuration from environment variables
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'localhost';
const TYPESENSE_PORT = parseInt(process.env.TYPESENSE_PORT || '8108', 10);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'http';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || 'xyz';
/**
 * Typesense client instance
 * Configured with connection settings from environment variables
 */
exports.typesenseClient = new typesense_1.default.Client({
    nodes: [
        {
            host: TYPESENSE_HOST,
            port: TYPESENSE_PORT,
            protocol: TYPESENSE_PROTOCOL,
        },
    ],
    apiKey: TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 10,
});
/**
 * Health check function to verify Typesense connection
 * @returns Promise<boolean> - true if connection is healthy, false otherwise
 */
async function checkTypesenseHealth() {
    try {
        const health = await exports.typesenseClient.health.retrieve();
        console.log('✅ Typesense health check passed:', health);
        return health.ok === true;
    }
    catch (error) {
        console.error('❌ Typesense health check failed:', error);
        return false;
    }
}
/**
 * Get Typesense server metrics
 * @returns Promise with server metrics
 */
async function getTypesenseMetrics() {
    try {
        const metrics = await exports.typesenseClient.metrics.retrieve();
        return metrics;
    }
    catch (error) {
        console.error('Failed to retrieve Typesense metrics:', error);
        throw error;
    }
}
/**
 * Configuration object for easy access
 */
exports.typesenseConfig = {
    host: TYPESENSE_HOST,
    port: TYPESENSE_PORT,
    protocol: TYPESENSE_PROTOCOL,
    collectionName: 'medicines',
};
