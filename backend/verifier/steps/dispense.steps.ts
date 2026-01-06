/**
 * Dispense Step Implementations
 * Steps for dispense workflow scenarios
 */

import { StepResult, ScenarioContext } from '../types';

const dispenseService = require('../../src/services/dispense/dispenseService');
const prisma = require('../../src/db/prisma');

export const dispenseSteps = {
    /**
     * Create a dispense from refill
     */
    async createDispense(
        ctx: ScenarioContext,
        params?: { refillId?: string; versionId?: string }
    ): Promise<StepResult> {
        try {
            const refillId = params?.refillId || ctx.get<string>('refillId');
            const versionId = params?.versionId || ctx.get<string>('versionId');

            const dispense = await dispenseService.createDispense(
                refillId,
                versionId,
                ctx.userId
            );

            ctx.set('dispense', dispense);
            ctx.set('dispenseId', dispense.id);

            return {
                success: true,
                data: dispense,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV createDispense error:', error.message);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Update dispense status
     */
    async updateStatus(
        ctx: ScenarioContext,
        status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'DISPENSED' | 'CANCELLED',
        dispenseId?: string
    ): Promise<StepResult> {
        try {
            const id = dispenseId || ctx.get<string>('dispenseId');

            const dispense = await dispenseService.updateStatus(
                id,
                status,
                ctx.userId,
                `DPFV: Progressed to ${status}`
            );

            ctx.set('dispense', dispense);

            return {
                success: true,
                data: dispense,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV updateDispenseStatus error:', error.message);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Get dispense by ID
     */
    async getDispense(ctx: ScenarioContext, dispenseId?: string): Promise<StepResult> {
        try {
            const id = dispenseId || ctx.get<string>('dispenseId');

            const dispense = await prisma.dispense.findUnique({
                where: { id },
                include: {
                    refill: {
                        include: {
                            prescription: true
                        }
                    },
                    version: true
                }
            });

            ctx.set('fetchedDispense', dispense);

            return {
                success: true,
                data: dispense,
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
     * Verify dispense workflow status
     */
    async verifyWorkflowStatus(
        ctx: ScenarioContext,
        expectedStatus: string
    ): Promise<StepResult> {
        try {
            const dispense = ctx.get<any>('dispense');
            const statusMatch = dispense.status === expectedStatus;

            return {
                success: statusMatch,
                data: { current: dispense.status, expected: expectedStatus },
                duration: 0,
                error: statusMatch ? undefined : new Error(
                    `Workflow status mismatch: expected ${expectedStatus}, got ${dispense.status}`
                )
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
     * Get ready dispenses for POS
     */
    async getReadyDispenses(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const dispenses = await prisma.dispense.findMany({
                where: {
                    refill: {
                        prescription: {
                            storeId: ctx.storeId
                        }
                    },
                    status: 'READY'
                },
                include: {
                    refill: {
                        include: {
                            prescription: {
                                include: {
                                    patient: true
                                }
                            }
                        }
                    }
                }
            });

            ctx.set('readyDispenses', dispenses);

            return {
                success: true,
                data: dispenses,
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
