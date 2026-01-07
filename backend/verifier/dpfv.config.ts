/**
 * DPFV Configuration
 */

import { RunConfig, ExecutionMode, ScenarioTag } from './types';
import { getModeConfig } from './runner/modes';

export interface DPFVConfig {
    mode: ExecutionMode;
    verbose: boolean;
    stopOnFirstFailure: boolean;
    outputFormat: 'console' | 'json';
    outputFile?: string;
    tags?: ScenarioTag[];
    features?: string[];
    scenarioIds?: string[];
}

export const defaultConfig: DPFVConfig = {
    mode: 'dev',
    verbose: true,
    stopOnFirstFailure: false,
    outputFormat: 'json',
    outputFile: 'dpfv-report.json'
};

export function buildRunConfig(config: Partial<DPFVConfig> = {}): RunConfig {
    const merged = { ...defaultConfig, ...config };
    const modeConfig = getModeConfig(merged.mode);

    return {
        mode: merged.mode,
        stopOnFirstFailure: merged.stopOnFirstFailure,
        tags: merged.tags,
        features: merged.features,
        scenarioIds: merged.scenarioIds,
        verbose: merged.verbose,
        outputFormat: merged.outputFormat,
        outputFile: merged.outputFile,
        baseUrl: modeConfig.baseUrl,
        cleanupAfterRun: modeConfig.cleanupAfterRun
    };
}

/**
 * Get database URL based on mode
 */
export function getDatabaseUrl(mode: ExecutionMode): string {
    switch (mode) {
        case 'dev':
            return process.env.DATABASE_URL || 'postgresql://localhost:5432/hoperx_dev';
        case 'staging':
            return process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || '';
        case 'ci':
            return process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
        default:
            return process.env.DATABASE_URL || '';
    }
}
