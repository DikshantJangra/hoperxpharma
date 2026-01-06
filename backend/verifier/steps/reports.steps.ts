/**
 * Reports Step Implementations
 * Steps for verifying reports and analytics
 */

import { StepResult, ScenarioContext } from '../types';

const salesAnalyticsService = require('../../src/services/sales/salesAnalyticsService');
const gstReportService = require('../../src/services/gstReportService');

export const reportsSteps = {
    /**
     * Get complete sales report
     */
    async getSalesReport(
        ctx: ScenarioContext,
        params: {
            datePreset?: string;
            customStart?: string;
            customEnd?: string;
        } = {}
    ): Promise<StepResult> {
        try {
            const storeId = ctx.storeId || ctx.get<any>('currentStore').id;

            const report = await salesAnalyticsService.getCompleteReport({
                storeId,
                datePreset: params.datePreset || 'today',
                customStart: params.customStart,
                customEnd: params.customEnd
            });

            ctx.set('lastSalesReport', report);

            return {
                success: true,
                data: report,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Export sales report
     */
    async exportSalesReport(
        ctx: ScenarioContext,
        params: {
            format: 'csv' | 'pdf';
            datePreset?: string;
        }
    ): Promise<StepResult> {
        try {
            const storeId = ctx.storeId || ctx.get<any>('currentStore').id;

            const exportResult = await salesAnalyticsService.exportReport({
                storeId,
                datePreset: params.datePreset || 'today',
                format: params.format
            });

            ctx.set('lastExport', exportResult);

            return {
                success: true,
                data: exportResult,
                duration: 0
            };
        } catch (error: any) {
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Get GST Dashboard
     */
    async getGSTDashboard(
        ctx: ScenarioContext,
        month?: string
    ): Promise<StepResult> {
        try {
            const storeId = ctx.storeId || ctx.get<any>('currentStore').id;

            const dashboard = await gstReportService.getDashboard(storeId, month);
            ctx.set('gstDashboard', dashboard);

            return {
                success: true,
                data: dashboard,
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
