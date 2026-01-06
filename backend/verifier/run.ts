#!/usr/bin/env ts-node
/**
 * DPFV Entry Point - CLI Runner
 * 
 * Usage:
 *   npx ts-node verifier/run.ts [options]
 * 
 * Options:
 *   --mode=dev|staging|ci    Execution mode (default: dev)
 *   --tags=critical,smoke    Filter by tags
 *   --features=pos,inventory Filter by features
 *   --scenario=pos.quick-sale Run specific scenario
 *   --fail-fast              Stop on first failure
 *   --json                   Output JSON report
 *   --output=./report.json   Output file for JSON report
 *   --quiet                  Suppress verbose output
 */

import { Runner } from './runner/Runner';
import { buildRunConfig, DPFVConfig } from './dpfv.config';
import { ExecutionMode, ScenarioTag } from './types';

// Import all scenarios
import { authScenario } from './scenarios/core/auth.flow';
import { onboardingScenario } from './scenarios/core/onboarding.flow';
import { quickSaleScenario } from './scenarios/pos/quick-sale.flow';
import { grnScenario } from './scenarios/procurement/grn.flow';
import { patientScenario } from './scenarios/patients/patient.flow';
import { prescriptionScenario } from './scenarios/clinical/prescription.flow';
import { dispenseScenario } from './scenarios/clinical/dispense.flow';
import { rxSaleScenario } from './scenarios/pos/rx-sale.flow';
import { rolesScenario } from './scenarios/admin/roles.flow';
import { pinScenario } from './scenarios/admin/pin.flow';
import { featuresScenario } from './scenarios/admin/features.flow';
import { supplierScenario } from './scenarios/procurement/supplier.flow';
import { poScenario } from './scenarios/procurement/po.flow';
import { accessLogScenario } from './scenarios/audit/access.flow';
import { salesReportScenario } from './scenarios/reports/sales.flow';
import { gdprScenario } from './scenarios/audit/gdpr.flow';
import { subscriptionScenario } from './scenarios/billing/subscription.flow';
import { emailScenario } from './scenarios/communication/email.flow';
import { whatsappScenario } from './scenarios/communication/whatsapp.flow';
import { draftScenario } from './scenarios/pos/draft.flow';
import { refundScenario } from './scenarios/pos/refund.flow';

/**
 * Parse command line arguments
 */
function parseArgs(): Partial<DPFVConfig> {
    const args = process.argv.slice(2);
    const config: Partial<DPFVConfig> = {};

    for (const arg of args) {
        if (arg.startsWith('--mode=')) {
            config.mode = arg.split('=')[1] as ExecutionMode;
        } else if (arg.startsWith('--tags=')) {
            config.tags = arg.split('=')[1].split(',') as ScenarioTag[];
        } else if (arg.startsWith('--features=')) {
            config.features = arg.split('=')[1].split(',');
        } else if (arg.startsWith('--scenario=')) {
            config.scenarioIds = arg.split('=')[1].split(',');
        } else if (arg === '--fail-fast') {
            config.stopOnFirstFailure = true;
        } else if (arg === '--json') {
            config.outputFormat = 'json';
        } else if (arg.startsWith('--output=')) {
            config.outputFile = arg.split('=')[1];
        } else if (arg === '--quiet') {
            config.verbose = false;
        } else if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        }
    }

    return config;
}

function printHelp(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                   DPFV - Deterministic Product Flow Verifier                  ║
║                            HopeRxPharma Edition                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

USAGE:
  npx ts-node verifier/run.ts [options]

OPTIONS:
  --mode=<mode>           Execution mode: dev, staging, ci (default: dev)
  --tags=<tags>           Filter by tags: critical, smoke, full, regression
  --features=<features>   Filter by features: pos, inventory, auth, etc.
  --scenario=<id>         Run specific scenario by ID
  --fail-fast             Stop on first failure
  --json                  Output JSON report
  --output=<file>         Output file path for JSON report
  --quiet                 Suppress verbose output
  --help, -h              Show this help message

EXAMPLES:
  # Run all critical scenarios in dev mode
  npx ts-node verifier/run.ts --mode=dev --tags=critical

  # Run quick sale scenario only
  npx ts-node verifier/run.ts --scenario=pos.quick-sale

  # Run with fail-fast and JSON output
  npx ts-node verifier/run.ts --fail-fast --json --output=./report.json

AVAILABLE SCENARIOS:
  core.auth          - Authentication flow (signup, login, token refresh)
  pos.quick-sale     - Quick sale with stock deduction
  procurement.grn    - PO → GRN → Stock update flow
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    console.log('\n🔬 DPFV - Deterministic Product Flow Verifier\n');

    const cliConfig = parseArgs();
    const runConfig = buildRunConfig(cliConfig);

    console.log(`Mode: ${runConfig.mode.toUpperCase()}`);
    console.log(`Fail-fast: ${runConfig.stopOnFirstFailure}`);
    console.log(`Verbose: ${runConfig.verbose}`);
    console.log('');

    // Create runner
    const runner = new Runner(runConfig);

    // Register all scenarios
    runner.register(
        authScenario,
        onboardingScenario,
        quickSaleScenario,
        grnScenario,
        patientScenario,
        prescriptionScenario,
        dispenseScenario,
        rxSaleScenario,
        rolesScenario,
        pinScenario,
        featuresScenario,
        supplierScenario,
        poScenario,
        accessLogScenario,
        salesReportScenario,
        salesReportScenario,
        gdprScenario,
        subscriptionScenario,
        emailScenario,
        whatsappScenario,
        draftScenario,
        refundScenario
    );

    try {
        // Run verification
        const report = await runner.run();

        // Exit with appropriate code
        const hasFailures = report.summary.failed > 0;
        process.exit(hasFailures ? 1 : 0);

    } catch (error: any) {
        console.error('\n❌ DPFV crashed with error:', error.message);
        console.error(error.stack);
        process.exit(2);
    }
}

// Run main
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(2);
});
