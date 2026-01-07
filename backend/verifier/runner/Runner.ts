/**
 * Main Runner - Orchestrates scenario execution
 */

import {
    Scenario,
    Step,
    RunConfig,
    RunReport,
    ScenarioResult,
    StepResult,
    AssertionResult,
    ExecutionMode
} from '../types';
import { ScenarioContext } from '../context/ScenarioContext';
import { DependencyResolver } from './DependencyResolver';
import { Reporter } from '../reporter/Reporter';
import { ConsoleReporter } from '../reporter/ConsoleReporter';

/**
 * Serialize error for JSON output with full details
 */
function serializeError(error: Error | undefined): any {
    if (!error) return undefined;
    
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        // Preserve Prisma-specific error details
        code: (error as any).code,
        meta: (error as any).meta,
        clientVersion: (error as any).clientVersion
    };
}

export class Runner {
    private scenarios: Map<string, Scenario> = new Map();
    private results: Map<string, ScenarioResult> = new Map();
    private config: RunConfig;
    private reporter: Reporter;
    private consoleReporter: ConsoleReporter;

    // Shared context that persists between scenarios
    private sharedContext: {
        userId: string;
        storeId: string;
        authToken: string;
        data: Map<string, unknown>;
    } = {
            userId: '',
            storeId: '',
            authToken: '',
            data: new Map()
        };

    constructor(config: RunConfig) {
        this.config = config;
        this.reporter = new Reporter(config);
        this.consoleReporter = new ConsoleReporter();
    }

    /**
     * Register scenarios to run
     */
    register(...scenarios: Scenario[]): void {
        scenarios.forEach(s => {
            this.scenarios.set(s.id, s);
        });
    }

    /**
     * Main execution entry point
     */
    async run(): Promise<RunReport> {
        const startTime = new Date();

        this.log('Starting DPFV run...');
        this.log(`Mode: ${this.config.mode}`);
        this.log(`Registered scenarios: ${this.scenarios.size}`);

        // 1. Resolve execution order based on dependencies
        const executionOrder = DependencyResolver.resolve(
            Array.from(this.scenarios.values()),
            {
                tags: this.config.tags,
                features: this.config.features,
                scenarioIds: this.config.scenarioIds,
                mode: this.config.mode
            }
        );

        this.log(`Execution order: ${executionOrder.map(s => s.id).join(' → ')}`);

        // 2. Execute scenarios in order
        for (const scenario of executionOrder) {
            // Check if dependencies passed
            const dependenciesPassed = this.checkDependencies(scenario);

            if (!dependenciesPassed) {
                const blockedBy = scenario.dependsOn.filter(dep =>
                    this.results.get(dep)?.status !== 'PASSED'
                );

                this.results.set(scenario.id, {
                    id: scenario.id,
                    status: 'BLOCKED',
                    blockedBy,
                    steps: [],
                    duration: 0
                });

                this.log(`⏸️  BLOCKED: ${scenario.id} (blocked by: ${blockedBy.join(', ')})`);
                continue;
            }

            // Execute scenario
            this.log(`\n▶️  Running: ${scenario.id}`);
            const result = await this.executeScenario(scenario);
            this.results.set(scenario.id, result);

            // Log result
            const icon = result.status === 'PASSED' ? '✅' : '❌';
            this.log(`${icon} ${result.status}: ${scenario.id} (${result.duration}ms)`);

            // Stop on first failure if configured
            if (this.config.stopOnFirstFailure && result.status === 'FAILED') {
                this.log(`\n🛑 Stopping on first failure (--fail-fast enabled)`);

                // Mark remaining scenarios as blocked
                for (const remainingScenario of executionOrder) {
                    if (!this.results.has(remainingScenario.id)) {
                        const downstream = DependencyResolver.getDownstream(
                            scenario.id,
                            Array.from(this.scenarios.values())
                        );

                        if (downstream.includes(remainingScenario.id)) {
                            this.results.set(remainingScenario.id, {
                                id: remainingScenario.id,
                                status: 'BLOCKED',
                                blockedBy: [scenario.id],
                                steps: [],
                                duration: 0
                            });
                        } else {
                            this.results.set(remainingScenario.id, {
                                id: remainingScenario.id,
                                status: 'SKIPPED',
                                steps: [],
                                duration: 0
                            });
                        }
                    }
                }
                break;
            }
        }

        const endTime = new Date();

        // 3. Generate report
        const report = this.reporter.generate(
            this.results,
            Array.from(this.scenarios.values()),
            startTime,
            endTime
        );

        // 4. Output report
        if (this.config.outputFormat === 'console' || this.config.verbose) {
            this.consoleReporter.print(report);
        }

        if (this.config.outputFormat === 'json' && this.config.outputFile) {
            const fs = require('fs');
            fs.writeFileSync(this.config.outputFile, JSON.stringify(report, null, 2));
            this.log(`\nJSON report written to: ${this.config.outputFile}`);
        } else if (this.config.outputFormat === 'json') {
            // Default output file if not specified
            const fs = require('fs');
            const path = require('path');
            const defaultOutputFile = path.join(process.cwd(), 'dpfv-report.json');
            fs.writeFileSync(defaultOutputFile, JSON.stringify(report, null, 2));
            this.log(`\nJSON report written to: ${defaultOutputFile}`);
        }

        return report;
    }

    /**
     * Check if all dependencies passed
     */
    private checkDependencies(scenario: Scenario): boolean {
        return scenario.dependsOn.every(depId => {
            const depResult = this.results.get(depId);
            return depResult?.status === 'PASSED';
        });
    }

    /**
     * Execute a single scenario
     */
    private async executeScenario(scenario: Scenario): Promise<ScenarioResult> {
        const context = new ScenarioContext(this.config.mode);
        const stepResults: StepResult[] = [];
        const startTime = Date.now();

        // Hydrate context from shared state (propagate from previous scenarios)
        if (this.sharedContext.userId) {
            context.userId = this.sharedContext.userId;
        }
        if (this.sharedContext.storeId) {
            context.storeId = this.sharedContext.storeId;
        }
        if (this.sharedContext.authToken) {
            context.authToken = this.sharedContext.authToken;
            context.set('authToken', this.sharedContext.authToken);
        }
        // Restore shared data
        this.sharedContext.data.forEach((value, key) => {
            context.set(key, value);
        });

        for (let i = 0; i < scenario.steps.length; i++) {
            const step = scenario.steps[i];

            this.log(`  [${i + 1}/${scenario.steps.length}] ${step.name}...`);

            const stepResult = await this.executeStep(step, context);
            stepResults.push(stepResult);

            // Log step result
            if (stepResult.success) {
                this.log(`    ✓ Passed (${stepResult.duration}ms)`);
            } else {
                // Extract clean error message for console
                const errorMsg = stepResult.error?.message || 'Assertion failed';
                const cleanMsg = errorMsg.split('\n')[0]; // First line only for console
                this.log(`    ✗ Failed: ${cleanMsg}`);

                // Log failed assertions
                stepResult.assertions?.filter(a => !a.passed).forEach(a => {
                    this.log(`      - ${a.message}`);
                    this.log(`        Expected: ${JSON.stringify(a.expected)}`);
                    this.log(`        Actual: ${JSON.stringify(a.actual)}`);
                });
            }

            // Stop scenario on critical step failure
            if (step.critical && !stepResult.success) {
                // Save context before failing (in case partial state is useful)
                this.saveContextToShared(context);

                return {
                    id: scenario.id,
                    status: 'FAILED',
                    failedAtStep: step.id,
                    steps: stepResults.map(sr => ({
                        ...sr,
                        error: serializeError(sr.error)
                    })),
                    error: serializeError(stepResult.error),
                    duration: Date.now() - startTime
                };
            }
        }

        // Save context to shared state for dependent scenarios
        this.saveContextToShared(context);

        return {
            id: scenario.id,
            status: 'PASSED',
            steps: stepResults.map(sr => ({
                ...sr,
                error: serializeError(sr.error)
            })),
            duration: Date.now() - startTime
        };
    }

    /**
     * Save context values to shared state for next scenario
     */
    private saveContextToShared(context: ScenarioContext): void {
        if (context.userId) {
            this.sharedContext.userId = context.userId;
        }
        if (context.storeId) {
            this.sharedContext.storeId = context.storeId;
        }
        if (context.authToken) {
            this.sharedContext.authToken = context.authToken;
        }
        // Copy over all context data
        const snapshot = context.snapshot();
        Object.entries(snapshot).forEach(([key, value]) => {
            this.sharedContext.data.set(key, value);
        });
    }

    /**
     * Execute a single step
     */
    private async executeStep(step: Step, context: ScenarioContext): Promise<StepResult> {
        const startTime = Date.now();

        try {
            // Execute with timeout
            const result = await Promise.race([
                step.execute(context),
                this.timeout(step.timeout, step.name)
            ]);

            // Run assertions
            const assertionResults: AssertionResult[] = [];

            for (const assertion of step.assertions) {
                try {
                    const assertResult = await assertion.check(context);
                    assertResult.invariant = assertion.invariant;
                    assertionResults.push(assertResult);
                } catch (assertError: any) {
                    assertionResults.push({
                        passed: false,
                        expected: 'No error',
                        actual: assertError.message,
                        message: `Assertion "${assertion.name}" threw: ${assertError.message}`,
                        invariant: assertion.invariant
                    });
                }
            }

            const allAssertionsPassed = assertionResults.every(r => r.passed);

            return {
                success: result.success && allAssertionsPassed,
                data: result.data,
                assertions: assertionResults,
                duration: Date.now() - startTime,
                error: allAssertionsPassed ? undefined : new Error('Assertion(s) failed')
            };

        } catch (error: any) {
            // Check for database connection errors
            const isDatabaseError = error.message?.includes("Can't reach database") ||
                error.message?.includes("Connection") ||
                error.code === 'P1001' || // Prisma connection error
                error.code === 'P1002'; // Prisma timeout

            if (isDatabaseError) {
                console.error('\n❌ FATAL: Database connection error detected');
                console.error('Error:', error.message);
                console.error('\n🧹 Running cleanup and exiting...');
                
                // Run cleanup
                const { cleanupDPFVData } = require('../cleanup');
                await cleanupDPFVData().catch(() => {});
                
                // Exit process
                process.exit(1);
            }

            return {
                success: false,
                error,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Create timeout promise
     */
    private timeout(ms: number, stepName: string): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Step "${stepName}" timed out after ${ms}ms`));
            }, ms);
        });
    }

    /**
     * Log message if verbose
     */
    private log(message: string): void {
        if (this.config.verbose) {
            console.log(message);
        }
    }
}
