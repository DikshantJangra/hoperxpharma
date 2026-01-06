/**
 * Console Reporter - Pretty print reports to terminal
 */

import { RunReport, ScenarioStatus } from '../types';

export class ConsoleReporter {
    private colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        bgRed: '\x1b[41m',
        bgGreen: '\x1b[42m',
        bgYellow: '\x1b[43m'
    };

    print(report: RunReport): void {
        console.log(this.formatReport(report));
    }

    formatReport(report: RunReport): string {
        const c = this.colors;
        const lines: string[] = [];

        // Header
        lines.push(this.box([
            `${c.bright}${c.cyan}DPFV RUN REPORT - HopeRxPharma${c.reset}`,
            `Run ID: ${report.runId}`,
            `Mode: ${report.mode.toUpperCase()} | Duration: ${(report.duration / 1000).toFixed(1)}s`
        ]));

        // Summary
        const { summary } = report;
        const passedText = `${c.green}✅ Passed: ${summary.passed}${c.reset}`;
        const failedText = summary.failed > 0
            ? `${c.red}❌ Failed: ${summary.failed}${c.reset}`
            : `❌ Failed: ${summary.failed}`;
        const blockedText = summary.blocked > 0
            ? `${c.yellow}⏸️  Blocked: ${summary.blocked}${c.reset}`
            : `⏸️  Blocked: ${summary.blocked}`;
        const skippedText = `⏭️  Skipped: ${summary.skipped}`;

        lines.push('');
        lines.push(`${c.bright}SUMMARY${c.reset}`);
        lines.push('─'.repeat(60));
        lines.push(`Total: ${summary.total} | ${passedText} | ${failedText} | ${blockedText} | ${skippedText}`);

        // Scenario Map
        lines.push('');
        lines.push(`${c.bright}SCENARIO MAP${c.reset}`);
        lines.push('─'.repeat(60));

        Object.entries(report.scenarioMap).forEach(([id, status]) => {
            const scenario = report.scenarios.find(s => s.id === id);
            const icon = this.statusIcon(status);
            const coloredStatus = this.colorStatus(status);
            const name = id.padEnd(30);
            lines.push(`${icon} ${coloredStatus} ${name}`);
        });

        // Failure Analysis
        if (report.failures.length > 0) {
            lines.push('');
            lines.push(`${c.bright}${c.red}❌ FAILURE ANALYSIS${c.reset}`);
            lines.push('─'.repeat(60));

            report.failures.forEach(failure => {
                lines.push('');
                lines.push(`${c.bright}Scenario:${c.reset} ${failure.scenarioName}`);
                lines.push(`${c.bright}Step:${c.reset} ${failure.stepName} (${failure.stepId})`);
                lines.push(`${c.bright}Invariant:${c.reset} ${failure.invariant}`);
                lines.push('');
                lines.push(`${c.dim}Expected:${c.reset} ${JSON.stringify(failure.expected)}`);
                lines.push(`${c.dim}Actual:${c.reset} ${JSON.stringify(failure.actual)}`);
                lines.push('');
                lines.push(`${c.bright}Business Impact:${c.reset} ${failure.businessImpact}`);

                if (failure.blockedDownstream.length > 0) {
                    lines.push(`${c.bright}Blocked Scenarios:${c.reset} ${failure.blockedDownstream.join(', ')}`);
                }

                lines.push('');
                lines.push(`${c.bright}Suggested Actions:${c.reset}`);
                failure.suggestedActions.forEach((action, i) => {
                    lines.push(`  ${i + 1}. ${action}`);
                });
            });
        }

        // Impact Analysis
        if (report.impactAnalysis.affectedFeatures.length > 0) {
            lines.push('');
            lines.push(`${c.bright}IMPACT ANALYSIS${c.reset}`);
            lines.push('─'.repeat(60));
            lines.push(`Affected Features: ${report.impactAnalysis.affectedFeatures.join(', ')}`);
            lines.push(`Total Blocked: ${report.impactAnalysis.totalBlocked}`);
            lines.push(`Critical Blocked: ${report.impactAnalysis.criticalBlocked}`);
        }

        // Footer
        lines.push('');
        lines.push('═'.repeat(60));

        return lines.join('\n');
    }

    private statusIcon(status: ScenarioStatus): string {
        switch (status) {
            case 'PASSED': return '✅';
            case 'FAILED': return '❌';
            case 'BLOCKED': return '⏸️ ';
            case 'SKIPPED': return '⏭️ ';
            default: return '❓';
        }
    }

    private colorStatus(status: ScenarioStatus): string {
        const c = this.colors;
        switch (status) {
            case 'PASSED': return `${c.green}PASSED${c.reset} `;
            case 'FAILED': return `${c.red}FAILED${c.reset} `;
            case 'BLOCKED': return `${c.yellow}BLOCKED${c.reset}`;
            case 'SKIPPED': return `${c.dim}SKIPPED${c.reset}`;
            default: return status;
        }
    }

    private box(lines: string[]): string {
        const width = 60;
        const border = '═'.repeat(width);
        const paddedLines = lines.map(l => {
            const stripped = l.replace(/\x1b\[[0-9;]*m/g, '');
            const padding = Math.max(0, width - stripped.length);
            return `║ ${l}${' '.repeat(padding)} ║`;
        });

        return [
            `╔${border}╗`,
            ...paddedLines,
            `╚${border}╝`
        ].join('\n');
    }
}
