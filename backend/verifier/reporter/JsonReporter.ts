/**
 * JSON Reporter - Output structured JSON reports
 */

import { RunReport } from '../types';
import * as fs from 'fs';

export class JsonReporter {
    /**
     * Write report to file
     */
    writeToFile(report: RunReport, filePath: string): void {
        const jsonContent = JSON.stringify(report, null, 2);
        fs.writeFileSync(filePath, jsonContent, 'utf-8');
    }

    /**
     * Get JSON string
     */
    toString(report: RunReport): string {
        return JSON.stringify(report, null, 2);
    }

    /**
     * Get compact JSON (single line)
     */
    toCompactString(report: RunReport): string {
        return JSON.stringify(report);
    }

    /**
     * Generate summary-only JSON (lighter weight)
     */
    toSummary(report: RunReport): string {
        return JSON.stringify({
            runId: report.runId,
            timestamp: report.timestamp,
            mode: report.mode,
            duration: report.duration,
            summary: report.summary,
            scenarioMap: report.scenarioMap,
            failureCount: report.failures.length,
            failures: report.failures.map(f => ({
                scenarioId: f.scenarioId,
                stepId: f.stepId,
                invariant: f.invariant,
                businessImpact: f.businessImpact
            }))
        }, null, 2);
    }
}
