
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

class GSTRiskService {
    /**
     * Calculate GST Confidence Score (0-100)
     * @param {string} storeId
     * @returns {Promise<{score: number, risks: Array<any>}>}
     */
    async calculateConfidence(storeId) {
        let score = 100;
        const risks = [];

        try {
            // Factor 1: HSN Compliance
            // Check count of items without HSN code or with "General" code if invalid
            // For now, we check if any HSN code is missing Tax Rate
            const invalidHsnCount = await prisma.drug.count({
                where: { storeId, isActive: true, hsnCodeId: null }
            });

            if (invalidHsnCount > 0) {
                const penalty = invalidHsnCount * 5;
                score -= penalty;
                risks.push({
                    type: 'HSN_COMPLIANCE',
                    severity: 'HIGH',
                    message: `${invalidHsnCount} HSN codes missing tax rates`,
                    deduction: penalty
                });
            }

            // Factor 2: Unreconciled Provisional ITC
            // (Placeholder until Purchase module is fully active)
            const provisionalItcCount = await prisma.gSTLedgerEntry.count({
                where: {
                    storeId,
                    eventType: 'PURCHASE',
                    itcStatus: 'PROVISIONAL'
                }
            });

            if (provisionalItcCount > 0) {
                // Small penalty for provisional, just a warning
                score -= 2;
                risks.push({
                    type: 'ITC_PROVISIONAL',
                    severity: 'MEDIUM',
                    message: `${provisionalItcCount} Purchase entries waiting for reconciliation`,
                    deduction: 2
                });
            }

            // Factor 3: GSTIN Validation gaps
            // (Placeholder)

            return {
                score: Math.max(0, score),
                risks
            };

        } catch (error) {
            console.error('[GSTRiskService] calculateConfidence Error:', error);
            logger.error('[GSTRiskService] Failed to calculate score', error);
            return { score: 0, risks: [{ type: 'SYSTEM_ERROR', message: 'Failed to calculate score' }] };
        }
    }
}

module.exports = new GSTRiskService();
