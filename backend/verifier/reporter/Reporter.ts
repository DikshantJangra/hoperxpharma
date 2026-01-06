/**
 * Reporter - Generate human-readable and JSON reports
 */

import {
    RunConfig,
    RunReport,
    ScenarioResult,
    FailureAnalysis,
    ImpactAnalysis,
    Scenario,
    ScenarioStatus
} from '../types';

export class Reporter {
    private config: RunConfig;

    constructor(config: RunConfig) {
        this.config = config;
    }

    generate(
        results: Map<string, ScenarioResult>,
        scenarios: Scenario[],
        startTime: Date,
        endTime: Date
    ): RunReport {
        const scenarioMap: Record<string, ScenarioStatus> = {};
        const scenarioResults: ScenarioResult[] = [];
        const failures: FailureAnalysis[] = [];

        let passed = 0, failed = 0, blocked = 0, skipped = 0;

        results.forEach((result, id) => {
            scenarioMap[id] = result.status;
            scenarioResults.push(result);

            switch (result.status) {
                case 'PASSED': passed++; break;
                case 'FAILED': failed++; break;
                case 'BLOCKED': blocked++; break;
                case 'SKIPPED': skipped++; break;
            }

            // Build failure analysis
            if (result.status === 'FAILED') {
                const scenario = scenarios.find(s => s.id === id);
                const failedStep = scenario?.steps.find(s => s.id === result.failedAtStep);
                const failedAssertion = result.steps
                    .flatMap(s => s.assertions || [])
                    .find(a => !a.passed);

                failures.push({
                    scenarioId: id,
                    scenarioName: scenario?.name || id,
                    stepId: result.failedAtStep || 'unknown',
                    stepName: failedStep?.name || 'Unknown step',
                    invariant: failedAssertion?.invariant || 'UNKNOWN',
                    expected: failedAssertion?.expected,
                    actual: failedAssertion?.actual,
                    businessImpact: this.inferBusinessImpact(id, failedAssertion?.invariant),
                    blockedDownstream: this.getBlockedDownstream(id, results),
                    suggestedActions: this.suggestActions(failedAssertion?.invariant || '')
                });
            }
        });

        // Build impact analysis
        const impactAnalysis: ImpactAnalysis = {
            affectedFeatures: this.getAffectedFeatures(failures, scenarios),
            totalBlocked: blocked,
            criticalBlocked: this.countCriticalBlocked(results, scenarios)
        };

        return {
            runId: `dpfv-${startTime.toISOString().split('T')[0]}-${Date.now()}`,
            timestamp: startTime,
            mode: this.config.mode,
            duration: endTime.getTime() - startTime.getTime(),
            summary: {
                total: results.size,
                passed,
                failed,
                blocked,
                skipped
            },
            scenarioMap,
            scenarios: scenarioResults,
            failures,
            impactAnalysis
        };
    }

    private getBlockedDownstream(
        failedId: string,
        results: Map<string, ScenarioResult>
    ): string[] {
        const blocked: string[] = [];
        results.forEach((result, id) => {
            if (result.status === 'BLOCKED' && result.blockedBy?.includes(failedId)) {
                blocked.push(id);
            }
        });
        return blocked;
    }

    private inferBusinessImpact(scenarioId: string, invariant?: string): string {
        const impacts: Record<string, string> = {
            'INV-001': 'HIGH: Stock tracking is broken, may lead to overselling',
            'INV-002': 'CRITICAL: Payment reconciliation will fail',
            'INV-003': 'HIGH: GST filing will have incorrect data',
            'INV-004': 'HIGH: Inventory will not reflect received goods',
            'INV-005': 'MEDIUM: Prescription workflow is broken',
            'INV-006': 'MEDIUM: Refill tracking is incorrect',
            'INV-007': 'MEDIUM: PO totals are miscalculated',
            'INV-008': 'CRITICAL: Store creation is broken, new users cannot onboard',
            'AUTH-001': 'CRITICAL: Authentication is broken',
            'SALE-001': 'HIGH: Invoice generation is broken'
        };

        return impacts[invariant || ''] || 'UNKNOWN: Requires investigation';
    }

    private suggestActions(invariant: string): string[] {
        const suggestions: Record<string, string[]> = {
            'INV-001': [
                'Check saleRepository.createSale transaction',
                'Verify StockMovement record creation',
                'Check inventoryService.allocateStock is called'
            ],
            'INV-002': [
                'Check payment split calculation in POS',
                'Verify rounding logic in saleService'
            ],
            'INV-003': [
                'Check gstCalculator logic',
                'Verify tax slab lookup',
                'Check inter/intra state determination'
            ],
            'INV-004': [
                'Check grnService.completeGRN',
                'Verify InventoryBatch creation/update'
            ],
            'AUTH-001': [
                'Check tokenService.generateTokens',
                'Verify JWT secret configuration'
            ]
        };

        return suggestions[invariant] || ['Review the failing step implementation'];
    }

    private getAffectedFeatures(
        failures: FailureAnalysis[],
        scenarios: Scenario[]
    ): string[] {
        const features = new Set<string>();
        failures.forEach(f => {
            const scenario = scenarios.find(s => s.id === f.scenarioId);
            scenario?.validatesFeatures.forEach(feat => features.add(feat));
        });
        return Array.from(features);
    }

    private countCriticalBlocked(
        results: Map<string, ScenarioResult>,
        scenarios: Scenario[]
    ): number {
        let count = 0;
        results.forEach((result, id) => {
            if (result.status === 'BLOCKED') {
                const scenario = scenarios.find(s => s.id === id);
                if (scenario?.tags.includes('critical')) {
                    count++;
                }
            }
        });
        return count;
    }
}
