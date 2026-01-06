/**
 * Patient Step Implementations
 * Steps for patient management scenarios
 */

import { StepResult, ScenarioContext } from '../types';

const patientService = require('../../src/services/patients/patientService');
const prisma = require('../../src/db/prisma');

export const patientSteps = {
    /**
     * Create a patient
     */
    async createPatient(
        ctx: ScenarioContext,
        params?: {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            email?: string;
            dateOfBirth?: Date;
            gender?: string;
        }
    ): Promise<StepResult> {
        try {
            const timestamp = Date.now();

            const patientData = {
                storeId: ctx.storeId,
                firstName: params?.firstName || `DPFV Patient ${timestamp}`,
                lastName: params?.lastName || 'Test',
                phoneNumber: params?.phoneNumber || `9${timestamp.toString().slice(-9)}`,
                email: params?.email || `patient-${timestamp}@test.hoperx.com`,
                dateOfBirth: params?.dateOfBirth || new Date('1990-01-15'),
                gender: params?.gender || 'MALE'
            };

            const patient = await patientService.createPatient(patientData);

            ctx.set('patient', patient);
            ctx.set('patientId', patient.id);

            return {
                success: true,
                data: patient,
                duration: 0
            };
        } catch (error: any) {
            console.error('DPFV createPatient error:', error.message);
            return {
                success: false,
                error,
                duration: 0
            };
        }
    },

    /**
     * Get patient by ID
     */
    async getPatient(ctx: ScenarioContext, patientId?: string): Promise<StepResult> {
        try {
            const id = patientId || ctx.get<string>('patientId');
            const patient = await patientService.getPatientById(id);

            ctx.set('fetchedPatient', patient);

            return {
                success: true,
                data: patient,
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
     * Update patient
     */
    async updatePatient(
        ctx: ScenarioContext,
        updates: Partial<{
            firstName: string;
            lastName: string;
            phoneNumber: string;
            email: string;
            allergies: string[];
        }>
    ): Promise<StepResult> {
        try {
            const patientId = ctx.get<string>('patientId');
            const patient = await patientService.updatePatient(patientId, updates);

            ctx.set('patient', patient);

            return {
                success: true,
                data: patient,
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
     * Ensure patient exists (create if needed)
     */
    /**
     * Ensure patient exists (create if needed)
     */
    async ensurePatientExists(ctx: ScenarioContext): Promise<StepResult> {
        try {
            let patient = await prisma.patient.findFirst({
                where: {
                    storeId: ctx.storeId,
                    deletedAt: null
                }
            });

            if (!patient) {
                const result = await this.createPatient(ctx);
                if (!result.success) return result;
                patient = result.data;
            } else {
                // If found existing, set context since createPatient wouldn't have run
                ctx.set('patient', patient);
                ctx.set('patientId', patient.id);
            }

            return {
                success: true,
                data: patient,
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
     * Get patient prescriptions
     */
    async getPatientPrescriptions(ctx: ScenarioContext, patientId?: string): Promise<StepResult> {
        try {
            const id = patientId || ctx.get<string>('patientId');

            const prescriptions = await prisma.prescription.findMany({
                where: {
                    patientId: id,
                    deletedAt: null
                },
                include: {
                    items: {
                        include: { drug: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            ctx.set('patientPrescriptions', prescriptions);

            return {
                success: true,
                data: prescriptions,
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
     * Get patient ledger balance
     */
    async getPatientLedger(ctx: ScenarioContext, patientId?: string): Promise<StepResult> {
        try {
            const id = patientId || ctx.get<string>('patientId');

            const ledger = await prisma.customerLedger.findFirst({
                where: { patientId: id }
            });

            ctx.set('patientLedger', ledger);

            return {
                success: true,
                data: ledger || { balance: 0 },
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
     * Verify patient data integrity
     */
    async verifyPatientData(ctx: ScenarioContext): Promise<StepResult> {
        try {
            const patient = ctx.get<any>('patient');

            const issues: string[] = [];

            if (!patient.firstName) issues.push('Missing firstName');
            if (!patient.phoneNumber) issues.push('Missing phoneNumber');
            if (!patient.storeId) issues.push('Missing storeId');

            return {
                success: issues.length === 0,
                data: { patient, issues },
                duration: 0,
                error: issues.length > 0 ? new Error(issues.join(', ')) : undefined
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
