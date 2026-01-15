/**
 * Typesense Client Configuration
 * 
 * This module provides a configured Typesense client for medicine search operations.
 * Typesense is used as the search engine for fast, fuzzy, and prefix-based medicine searches.
 */

import Typesense from 'typesense';

// Typesense configuration from environment variables
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'localhost';
const TYPESENSE_PORT = parseInt(process.env.TYPESENSE_PORT || '8108', 10);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'http';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || 'xyz';

/**
 * Typesense client instance
 * Configured with connection settings from environment variables
 */
export const typesenseClient = new Typesense.Client({
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
export async function checkTypesenseHealth(): Promise<boolean> {
  try {
    const health = await typesenseClient.health.retrieve();
    console.log('✅ Typesense health check passed:', health);
    return health.ok === true;
  } catch (error) {
    console.error('❌ Typesense health check failed:', error);
    return false;
  }
}

/**
 * Get Typesense server metrics
 * @returns Promise with server metrics
 */
export async function getTypesenseMetrics() {
  try {
    const metrics = await typesenseClient.metrics.retrieve();
    return metrics;
  } catch (error) {
    console.error('Failed to retrieve Typesense metrics:', error);
    throw error;
  }
}

/**
 * Configuration object for easy access
 */
export const typesenseConfig = {
  host: TYPESENSE_HOST,
  port: TYPESENSE_PORT,
  protocol: TYPESENSE_PROTOCOL,
  collectionName: 'medicines',
};
