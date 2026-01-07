/**
 * GDPR Steps
 * Steps for validating GDPR and data export
 */

import { StepResult, ScenarioContext } from '../types';

const dataExportService = require('../../src/services/gdpr/dataExportService');

export const gdprSteps = {
    /**
     * Request data export for current user
     */
    async exportUserData(ctx: ScenarioContext, userId?: string): Promise<StepResult> {
        try {
            const targetUserId = userId || ctx.userId || ctx.get('userId');
            if (!targetUserId) throw new Error('User ID required for export');

            const exportData = await dataExportService.collectUserData(targetUserId);

            ctx.set('gdprExport', exportData);

            return {
                success: true,
                data: exportData,
                duration: 0
            };
        } catch (error: any) {
            // Set empty export on error so assertions can check it
            ctx.set('gdprExport', null);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Convert export to CSV
     */
    async convertToCSV(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const exportData = ctx.get<any>('gdprExport');
            const csv = dataExportService.convertToCSV(exportData);

            ctx.set('gdprCsv', csv);

            return {
                success: true,
                data: { length: csv.length },
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    }
};
