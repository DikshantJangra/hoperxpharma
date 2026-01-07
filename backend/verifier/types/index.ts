/**
 * DPFV Type Definitions
 * Deterministic Product Flow Verifier - Type System
 */

// ============================================================================
// Scenario Types
// ============================================================================

export interface Scenario {
    /** Unique identifier (e.g., 'pos.quick-sale') */
    id: string;

    /** Human-readable name */
    name: string;

    /** Description of what this scenario validates */
    description: string;

    /** Scenario IDs that must pass before this one runs */
    dependsOn: string[];

    /** Features this scenario validates (for filtering) */
    validatesFeatures: string[];

    /** Ordered steps to execute */
    steps: Step[];

    /** Tags for filtering (critical = must pass, smoke = quick validation) */
    tags: ScenarioTag[];

    /** Execution modes this scenario supports */
    modes: ExecutionMode[];
}

// Valid tags for scenarios
export type ScenarioTag =
    | 'core'
    | 'auth'
    | 'onboarding'
    | 'inventory'
    | 'clinical'
    | 'financial'
    | 'pos'
    | 'reports'
    | 'admin'
    | 'audit'
    | 'smoke'
    | 'regression'
    | 'wip'
    | 'billing'
    | 'credit'
    | 'communication'
    | 'compliance'
    | 'critical'
    | 'full'
    | 'patients'
    | 'procurement'
    | 'documents';
export type ExecutionMode = 'dev' | 'staging' | 'ci';

// ============================================================================
// Step Types
// ============================================================================

export interface Step {
    /** Unique identifier within scenario */
    id: string;

    /** Human-readable name */
    name: string;

    /** The action to execute */
    execute: (context: ScenarioContext) => Promise<StepResult>;

    /** Post-execution assertions */
    assertions: Assertion[];

    /** If true, scenario fails immediately on step failure */
    critical: boolean;

    /** Timeout in milliseconds */
    timeout: number;
}

export interface StepResult {
    /** Whether the step execution succeeded */
    success: boolean;

    /** Any data returned by the step */
    data?: unknown;

    /** Error if step failed */
    error?: Error;

    /** Execution duration in ms */
    duration: number;

    /** Assertion results */
    assertions?: AssertionResult[];
}

// ============================================================================
// Assertion Types
// ============================================================================

export interface Assertion {
    /** Human-readable name */
    name: string;

    /** Reference to business invariant (e.g., 'INV-001') */
    invariant: string;

    /** The check function */
    check: (context: ScenarioContext) => Promise<AssertionResult>;
}

export interface AssertionResult {
    /** Whether the assertion passed */
    passed: boolean;

    /** What we expected */
    expected: unknown;

    /** What we actually got */
    actual: unknown;

    /** Human-readable message */
    message: string;

    /** Reference to invariant */
    invariant?: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface ScenarioContext {
    /** Current execution mode */
    mode: ExecutionMode;

    /** Store ID for current test */
    storeId: string;

    /** Current user ID */
    userId: string;

    /** Auth token for API calls */
    authToken: string;

    /** Get a value from context */
    get<T>(key: string): T;

    /** Set a value in context */
    set<T>(key: string, value: T): void;

    /** Check if key exists */
    has(key: string): boolean;

    /** Get snapshot of all data */
    snapshot(): Record<string, unknown>;

    /** Set auth credentials */
    setAuth(userId: string, storeId: string, authToken: string): void;

    /** Clear all data */
    clear(): void;
}

// ============================================================================
// Runner Types
// ============================================================================

export interface RunConfig {
    /** Execution mode */
    mode: ExecutionMode;

    /** Stop on first failure */
    stopOnFirstFailure: boolean;

    /** Filter by tags */
    tags?: ScenarioTag[];

    /** Filter by features */
    features?: string[];

    /** Filter by scenario IDs */
    scenarioIds?: string[];

    /** Verbose output */
    verbose: boolean;

    /** Output format */
    outputFormat: 'console' | 'json';

    /** Output file path (for json) */
    outputFile?: string;

    /** Database URL override */
    databaseUrl?: string;

    /** API base URL */
    baseUrl: string;

    /** Clean up after run */
    cleanupAfterRun: boolean;
}

export interface ModeConfig {
    database: string;
    baseUrl: string;
    cleanupAfterRun: boolean;
    parallel: boolean;
    verbose: boolean;
    failFast?: boolean;
}

// ============================================================================
// Result Types
// ============================================================================

export type ScenarioStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

export interface ScenarioResult {
    /** Scenario ID */
    id: string;

    /** Execution status */
    status: ScenarioStatus;

    /** Step that failed (if status is FAILED) */
    failedAtStep?: string;

    /** Scenarios that blocked this one (if status is BLOCKED) */
    blockedBy?: string[];

    /** Individual step results */
    steps: StepResult[];

    /** Error details if failed */
    error?: Error;

    /** Total duration in ms */
    duration: number;
}

export interface RunReport {
    /** Unique run identifier */
    runId: string;

    /** When the run started */
    timestamp: Date;

    /** Execution mode */
    mode: ExecutionMode;

    /** Total duration in ms */
    duration: number;

    /** Summary counts */
    summary: {
        total: number;
        passed: number;
        failed: number;
        blocked: number;
        skipped: number;
    };

    /** Quick PASS/FAIL map */
    scenarioMap: Record<string, ScenarioStatus>;

    /** Detailed scenario results */
    scenarios: ScenarioResult[];

    /** Failure analysis */
    failures: FailureAnalysis[];

    /** Impact analysis */
    impactAnalysis: ImpactAnalysis;
}

export interface FailureAnalysis {
    /** Scenario that failed */
    scenarioId: string;

    /** Scenario name */
    scenarioName: string;

    /** Step that failed */
    stepId: string;

    /** Step name */
    stepName: string;

    /** Which invariant was violated */
    invariant: string;

    /** What we expected */
    expected: unknown;

    /** What we got */
    actual: unknown;

    /** Business impact description */
    businessImpact: string;

    /** Scenarios blocked by this failure */
    blockedDownstream: string[];

    /** Suggested debugging actions */
    suggestedActions: string[];
}

export interface ImpactAnalysis {
    /** Features affected by failures */
    affectedFeatures: string[];

    /** Total scenarios blocked */
    totalBlocked: number;

    /** Critical scenarios blocked */
    criticalBlocked: number;
}

// ============================================================================
// Fixture Types
// ============================================================================

export interface UserFixture {
    email: string;
    phoneNumber: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
}

export interface DrugFixture {
    name: string;
    genericName?: string;
    strength?: string;
    form?: string;
    manufacturer?: string;
    hsnCode?: string;
    gstRate?: number;
    requiresPrescription?: boolean;
}

export interface BatchFixture {
    drugId?: string;
    drugName?: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
    mrp: number;
    purchasePrice: number;
    supplierId?: string;
    location?: string;
}

export interface SupplierFixture {
    name: string;
    category: string;
    contactName: string;
    phoneNumber: string;
    email?: string;
    gstin?: string;
    addressLine1: string;
    city: string;
    state: string;
    pinCode: string;
}

export interface SaleItemFixture {
    drugId: string;
    batchId: string;
    quantity: number;
    mrp: number;
    discount?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface StepBuilder {
    (
        id: string,
        name: string,
        execute: (ctx: ScenarioContext) => Promise<StepResult>,
        options?: Partial<Pick<Step, 'assertions' | 'critical' | 'timeout'>>
    ): Step;
}

export type InvariantCode =
    | 'INV-001' // Stock never negative
    | 'INV-002' // Payment total = sale total
    | 'INV-003' // GST calculated correctly
    | 'INV-004' // GRN updates stock
    | 'INV-005' // Prescription status lifecycle
    | 'INV-006' // Refill quantity tracking
    | 'INV-007' // PO total = sum of line totals
    | 'INV-008' // Onboarding atomicity
    | 'INV-009' // FIFO stock allocation
    | 'INV-010' // GST inter/intra state
    | 'INV-AUDIT' // Audit trail exists
    | 'SALE-001' // Invoice number generated
    | 'AUTH-001' // Token validity
    | 'AUTH-002'; // Password hashing
