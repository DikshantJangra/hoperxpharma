/**
 * Execution Mode Configurations
 */

import { ModeConfig } from '../types';

export const modes: Record<string, ModeConfig> = {
    dev: {
        database: 'local',
        baseUrl: 'http://localhost:5000',
        cleanupAfterRun: true,
        parallel: false,
        verbose: true
    },
    staging: {
        database: 'staging',
        baseUrl: process.env.STAGING_API_URL || 'https://staging-api.hoperx.com',
        cleanupAfterRun: false,
        parallel: false,
        verbose: false
    },
    ci: {
        database: 'test',
        baseUrl: 'http://localhost:5000',
        cleanupAfterRun: true,
        parallel: false,
        verbose: true,
        failFast: true
    }
};

export function getModeConfig(mode: string): ModeConfig {
    const config = modes[mode];
    if (!config) {
        throw new Error(`Unknown execution mode: ${mode}. Valid modes: ${Object.keys(modes).join(', ')}`);
    }
    return config;
}
