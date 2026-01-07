/**
 * Prescription Step Implementations
 * Steps for prescription management scenarios
 */

import { StepResult, ScenarioContext } from '../types';

const prescriptionService = require('../../src/services/prescriptions/prescriptionService');
const refillService = require('../../src/services/prescriptions/refillService');
const prisma = require('../../src/db/prisma');

export const prescriptionSteps = {
    /**
     * Create a prescription
     */
    async createPrescription(
        ctx: ScenarioContext,
        params: {
            patientId?: string;
            type?: 'REGULAR' | 'ONE_TIME' | 'PRN';
            items: {
                drugId: string;
                batchId?: string;
                quantity: number;
                sig?: string;
            }[];
        }
    ): Promise<StepResult> {
        try {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 6);

            const prescriptionData = {
                storeId: ctx.storeId,
                patientId: params.patientId || null,
                type: params.type || 'ONE_TIME',
                totalRefills: params.type === 'REGULAR' ? 3 : 0,
                expiryDate,
                items: params.items.map(item => ({
                    drugId: item.drugId,
                    batchId: item.batchId,
                    quantity: item.quantity,
                    sig: item.sig || 'As directed',
                    substitutionAllowed: true
                })),
                instructions: 'DPFV Test Prescription'
            };

            const prescription = await prescriptionService.createPrescription(
                prescriptionData,
                ctx.userId
            );

            ctx.set('prescription', prescription);
            ctx.set('prescriptionId', prescription.id);

            return {
                success: true,
                data: prescription,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV createPrescription error:', error.message);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Activate a prescription
     */
    async activatePrescription(ctx: ScenarioContext, prescriptionId?: string): Promise<StepResult> {
        try {
            const id = prescriptionId || ctx.get<string>('prescriptionId');
            const prescription = await prescriptionService.activatePrescription(id, ctx.userId);

            ctx.set('prescription', prescription);

            return {
                success: true,
                data: prescription,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV activatePrescription error:', error.message);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Get prescription by ID
     */
    async getPrescription(ctx: ScenarioContext, prescriptionId?: string): Promise<StepResult> {
        try {
            const id = prescriptionId || ctx.get<string>('prescriptionId');
            const prescription = await prescriptionService.getPrescriptionById(id);

            ctx.set('fetchedPrescription', prescription);

            return {
                success: true,
                data: prescription,
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
     * Get next available refill
     */
    async getNextRefill(ctx: ScenarioContext, prescriptionId?: string): Promise<StepResult> {
        try {
            const id = prescriptionId || ctx.get<string>('prescriptionId');
            const refill = await refillService.getNextAvailableRefill(id);

            ctx.set('currentRefill', refill);
            ctx.set('refillId', refill.id);

            // Also fetch and set the latest version ID for dispense creation
            const prescription = await prescriptionService.getPrescriptionById(id);
            const latestVersion = prescription.versions?.[0];
            if (latestVersion) {
                ctx.set('versionId', latestVersion.id);
            }

            return {
                success: true,
                data: refill,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV getNextRefill error:', error.message);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Verify prescription status
     */
    async verifyStatus(
        ctx: ScenarioContext,
        expectedStatus: string,
        prescriptionId?: string
    ): Promise<StepResult> {
        try {
            const id = prescriptionId || ctx.get<string>('prescriptionId');
            const prescription = await prescriptionService.getPrescriptionById(id);

            const statusMatch = prescription.status === expectedStatus;

            return {
                success: statusMatch,
                data: { status: prescription.status, expected: expectedStatus },
                duration: 0,
                error: statusMatch ? undefined : new Error(
                    `Status mismatch: expected ${expectedStatus}, got ${prescription.status}`
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
     * Verify refill count
     */
    async verifyRefillCount(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const prescriptionId = ctx.get<string>('prescriptionId');

            const prescription = await prisma.prescription.findUnique({
                where: { id: prescriptionId },
                include: { refills: true }
            });

            const usedRefills = prescription.refills.filter(
                (r: any) => r.status === 'COMPLETED'
            ).length;

            ctx.set('usedRefillCount', usedRefills);

            return {
                success: true,
                data: {
                    total: prescription.totalRefills,
                    used: usedRefills,
                    remaining: prescription.totalRefills - usedRefills
                },
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
