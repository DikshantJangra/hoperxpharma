/**
 * State Assertions - Business invariant checks for status transitions and state management
 */

import { AssertionResult, ScenarioContext } from '../types';

const prisma = require('../../src/db/prisma');

export const stateAssert = {
    /**
     * INV-005: Prescription status lifecycle
     */
    async checkPrescriptionStatus(
        ctx: ScenarioContext,
        prescriptionId: string,
        expectedStatus: string
    ): Promise<AssertionResult> {
        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId }
        });

        if (!prescription) {
            return {
                passed: false,
                expected: `Prescription with status ${expectedStatus}`,
                actual: 'Prescription not found',
                message: `Prescription ${prescriptionId} not found`
            };
        }

        return {
            passed: prescription.status === expectedStatus,
            expected: expectedStatus,
            actual: prescription.status,
            message: `Prescription status should be ${expectedStatus}`
        };
    },

    /**
     * INV-005: Prescription status follows valid transitions
     */
    async checkPrescriptionTransition(
        ctx: ScenarioContext,
        prescriptionId: string,
        fromStatus: string,
        toStatus: string
    ): Promise<AssertionResult> {
        const validTransitions: Record<string, string[]> = {
            'DRAFT': ['ACTIVE', 'CANCELLED'],
            'ACTIVE': ['COMPLETED', 'EXPIRED', 'CANCELLED'],
            'COMPLETED': [],
            'EXPIRED': [],
            'CANCELLED': []
        };

        const isValid = validTransitions[fromStatus]?.includes(toStatus);

        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId }
        });

        return {
            passed: isValid && prescription?.status === toStatus,
            expected: `Valid transition from ${fromStatus} to ${toStatus}`,
            actual: prescription?.status,
            message: `Prescription transition must follow lifecycle: ${fromStatus} → ${toStatus}`
        };
    },

    /**
     * Check PO status lifecycle
     */
    async checkPOStatus(
        ctx: ScenarioContext,
        poId: string,
        expectedStatus: string
    ): Promise<AssertionResult> {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId }
        });

        if (!po) {
            return {
                passed: false,
                expected: `PO with status ${expectedStatus}`,
                actual: 'PO not found',
                message: `PurchaseOrder ${poId} not found`
            };
        }

        return {
            passed: po.status === expectedStatus,
            expected: expectedStatus,
            actual: po.status,
            message: `PO status should be ${expectedStatus}`
        };
    },

    /**
     * Check GRN status
     */
    async checkGRNStatus(
        ctx: ScenarioContext,
        grnId: string,
        expectedStatus: string
    ): Promise<AssertionResult> {
        const grn = await prisma.goodsReceivedNote.findUnique({
            where: { id: grnId }
        });

        if (!grn) {
            return {
                passed: false,
                expected: `GRN with status ${expectedStatus}`,
                actual: 'GRN not found',
                message: `GRN ${grnId} not found`
            };
        }

        return {
            passed: grn.status === expectedStatus,
            expected: expectedStatus,
            actual: grn.status,
            message: `GRN status should be ${expectedStatus}`
        };
    },

    /**
     * INV-006: Refill quantity tracking
     */
    async checkRefillQuantity(
        ctx: ScenarioContext,
        refillId: string
    ): Promise<AssertionResult> {
        const refill = await prisma.refill.findUnique({
            where: { id: refillId }
        });

        if (!refill) {
            return {
                passed: false,
                expected: 'Refill exists',
                actual: 'Refill not found',
                message: `Refill ${refillId} not found`
            };
        }

        const valid = refill.dispensedQty <= refill.authorizedQty &&
            refill.remainingQty === refill.authorizedQty - refill.dispensedQty;

        return {
            passed: valid,
            expected: {
                dispensedQty: `<= ${refill.authorizedQty}`,
                remainingQty: refill.authorizedQty - refill.dispensedQty
            },
            actual: {
                dispensedQty: refill.dispensedQty,
                remainingQty: refill.remainingQty,
                authorizedQty: refill.authorizedQty
            },
            message: 'Refill quantities must be tracked correctly'
        };
    },

    /**
     * Check dispense workflow status
     */
    async checkDispenseStatus(
        ctx: ScenarioContext,
        dispenseId: string,
        expectedStatus: string
    ): Promise<AssertionResult> {
        const dispense = await prisma.dispense.findUnique({
            where: { id: dispenseId }
        });

        if (!dispense) {
            return {
                passed: false,
                expected: `Dispense with status ${expectedStatus}`,
                actual: 'Dispense not found',
                message: `Dispense ${dispenseId} not found`
            };
        }

        return {
            passed: dispense.status === expectedStatus,
            expected: expectedStatus,
            actual: dispense.status,
            message: `Dispense status should be ${expectedStatus}`
        };
    },

    /**
     * Check user is active
     */
    async checkUserActive(ctx: ScenarioContext, userId: string): Promise<AssertionResult> {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return {
                passed: false,
                expected: 'Active user',
                actual: 'User not found',
                message: `User ${userId} not found`
            };
        }

        return {
            passed: user.isActive === true,
            expected: true,
            actual: user.isActive,
            message: 'User should be active'
        };
    },

    /**
     * INV-008: Onboarding atomicity check
     */
    async checkOnboardingComplete(ctx: ScenarioContext, userId: string): Promise<AssertionResult> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                storeUsers: {
                    include: {
                        store: {
                            include: {
                                subscription: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return {
                passed: false,
                expected: 'User with store and subscription',
                actual: 'User not found',
                message: `User ${userId} not found`
            };
        }

        const hasStore = user.storeUsers.length > 0;
        const hasSubscription = user.storeUsers.some(
            (su: any) => su.store?.subscription !== null
        );

        return {
            passed: hasStore && hasSubscription,
            expected: { hasStore: true, hasSubscription: true },
            actual: { hasStore, hasSubscription },
            message: 'Onboarding must create Store + StoreUser + Subscription atomically'
        };
    }
};
