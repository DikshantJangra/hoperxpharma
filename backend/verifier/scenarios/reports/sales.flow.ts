/**
 * Sales Report Scenario
 * Validates sales reporting and analytics
 */

import { Scenario } from '../../types';
import { inventorySteps } from '../../steps/inventory.steps';
import { posSteps } from '../../steps/pos.steps';
import { reportsSteps } from '../../steps/reports.steps';
import { authSteps } from '../../steps/auth.steps';

const onboardingService = require('../../../src/services/onboarding/onboardingService');
const prisma = require('../../../src/db/prisma');

export const salesReportScenario: Scenario = {
    id: 'reports.sales',
    name: 'Sales Reporting & Analytics',
    description: 'Verifies that sales are correctly aggregated in reports',

    dependsOn: [], // Self-contained setup
    validatesFeatures: ['reports', 'analytics', 'kpi'],
    tags: ['reports', 'regression'],
    modes: ['dev', 'staging', 'ci'],

    steps: [
        {
            id: 'reports.setup.store',
            name: 'Setup Store and User',
            execute: async (ctx) => {
                // 1. Create User
                const timestamp = Date.now();
                const signupResult = await authSteps.signup(ctx, {
                    email: `report-admin-${timestamp}@test.hoperx.com`,
                    password: 'password123',
                    firstName: 'Report',
                    lastName: 'Admin',
                    phoneNumber: `9${timestamp.toString().slice(-9)}`
                });

                if (!signupResult.success) return signupResult;

                // 2. Create Store
                const userId = ctx.userId;
                try {
                    const result = await onboardingService.completeOnboarding({
                        store: {
                            name: `Report Test Pharmacy ${timestamp}`,
                            displayName: `Report Pharma ${timestamp}`,
                            email: `report-store-${timestamp}@test.hoperx.com`,
                            phoneNumber: `9${timestamp.toString().slice(-9)}`,
                            businessType: 'Retail Pharmacy',
                            addressLine1: 'Test Address',
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            pinCode: '400001'
                        },
                        licenses: [],
                        operatingHours: [],
                        suppliers: [],
                        users: []
                    }, userId);

                    ctx.set('onboardingResult', result);
                    ctx.set('currentStore', result.store);
                    ctx.storeId = result.store.id;

                    // 3. Create Patient (Required for prescription)
                    const patient = await prisma.patient.create({
                        data: {
                            storeId: result.store.id,
                            firstName: 'Test',
                            lastName: 'Patient',
                            phoneNumber: `9${timestamp.toString().slice(-9)}`,
                            gender: 'Male'
                        }
                    });
                    ctx.set('currentPatient', patient);
                    ctx.set('patientId', patient.id);

                    return { success: true, duration: 0, data: { ...result, patient } };
                } catch (error: any) {
                    return { success: false, error, duration: 0 };
                }
            },
            assertions: [],
            critical: true,
            timeout: 10000
        },
        {
            id: 'reports.setup.sale',
            name: 'Create a tracked sale',
            execute: async (ctx) => {
                // 1. Ensure stock
                const batch = await inventorySteps.ensureBatchExists(ctx, {
                    drugName: 'Report Test Drug',
                    quantity: 50,
                    mrp: 100,
                    expiryMonths: 12
                });

                // 2. Create sale
                const saleResult = await posSteps.createQuickSale(ctx, {
                    items: [{
                        drugId: batch.drugId,
                        batchId: batch.id,
                        quantity: 2,
                        mrp: 100,
                        discount: 0
                    }],
                    paymentMethod: 'CASH',
                    patientId: ctx.get<string>('patientId')
                });

                if (!saleResult.success || !saleResult.data) {
                    throw new Error('Failed to create sale: ' + (saleResult.error?.message || 'Unknown error'));
                }

                const sale = saleResult.data;
                ctx.set('trackedSale', sale);
                return { success: true, data: sale, duration: 0 };
            },
            assertions: [],
            critical: true,
            timeout: 30000
        },
        {
            id: 'reports.get-today',
            name: 'Get sales report for today',
            execute: async (ctx) => reportsSteps.getSalesReport(ctx, { datePreset: 'today' }),
            assertions: [
                {
                    name: 'Revenue reflects recent sale',
                    invariant: 'RPT-001',
                    check: async (ctx) => {
                        const report = ctx.get<any>('lastSalesReport');
                        const sale = ctx.get<any>('trackedSale');

                        // Note: This assumes report includes this sale. 
                        // If DB is shared, revenue > sale.total.
                        return {
                            passed: Number(report.kpis.revenue) >= Number(sale.total),
                            expected: `>= ${sale.total}`,
                            actual: report.kpis.revenue,
                            message: 'Report revenue must include the tracked sale'
                        };
                    }
                },
                {
                    name: 'Order count is positive',
                    invariant: 'RPT-002',
                    check: async (ctx) => {
                        const report = ctx.get<any>('lastSalesReport');
                        return {
                            passed: report.kpis.orders > 0,
                            expected: '> 0',
                            actual: report.kpis.orders,
                            message: 'Order count must be positive'
                        };
                    }
                }
            ],
            critical: true,
            timeout: 5000
        },
        {
            id: 'reports.export',
            name: 'Export sales report',
            execute: async (ctx) => reportsSteps.exportSalesReport(ctx, { format: 'csv' }),
            assertions: [
                {
                    name: 'Export structure matches schema',
                    invariant: 'RPT-003',
                    check: async (ctx) => {
                        const exportData = ctx.get<any>('lastExport');
                        return {
                            passed: !!exportData.data.summary && !!exportData.filename,
                            expected: 'Valid export object',
                            actual: Object.keys(exportData),
                            message: 'Export must return data and filename'
                        };
                    }
                }
            ],
            critical: false,
            timeout: 5000
        }
    ]
};
