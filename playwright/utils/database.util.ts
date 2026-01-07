/**
 * Database Utilities for Backend Verification
 * 
 * Provides direct Prisma client access for:
 * - Verifying backend state after UI actions
 * - Setting up test data
 * - Cleaning up after tests
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 */
export function getDatabase(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
                },
            },
            log: process.env.DEBUG_PRISMA ? ['query', 'error', 'warn'] : ['error'],
        });
    }

    return prisma;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}

/**
 * Database Assertion Helpers
 */
export class DatabaseAssertions {
    constructor(private db: PrismaClient) { }

    /**
     * Verify a record exists
     */
    async expectRecordExists(model: string, where: object): Promise<any> {
        const record = await (this.db as any)[model].findUnique({ where });
        if (!record) {
            throw new Error(`Expected ${model} record with ${JSON.stringify(where)} to exist, but it doesn't`);
        }
        return record;
    }

    /**
     * Verify a record does not exist
     */
    async expectRecordNotExists(model: string, where: object): Promise<void> {
        const record = await (this.db as any)[model].findUnique({ where });
        if (record) {
            throw new Error(`Expected ${model} record with ${JSON.stringify(where)} NOT to exist, but it does`);
        }
    }

    /**
     * Verify record count matches expected
     */
    async expectRecordCount(model: string, where: object, expectedCount: number): Promise<void> {
        const count = await (this.db as any)[model].count({ where });
        if (count !== expectedCount) {
            throw new Error(`Expected ${expectedCount} ${model} records, but found ${count}`);
        }
    }

    /**
     * Verify audit log exists
     */
    async expectAuditLog(eventType: string, userId: string): Promise<any> {
        const log = await this.db.auditLog.findFirst({
            where: { action: eventType, userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!log) {
            throw new Error(`Expected audit log with eventType="${eventType}" and userId="${userId}" to exist`);
        }

        return log;
    }

    /**
     * Verify access log exists
     */
    async expectAccessLog(userId: string, eventType: string, loginMethod?: string): Promise<any> {
        const where: any = { userId, eventType };
        if (loginMethod) {
            where.loginMethod = loginMethod;
        }

        const log = await this.db.accessLog.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
        });

        if (!log) {
            throw new Error(`Expected access log for user ${userId} with eventType ${eventType}`);
        }

        return log;
    }

    /**
     * Verify inventory batch quantity
     */
    async expectBatchQuantity(batchId: string, expectedQuantity: number): Promise<void> {
        const batch = await this.db.inventoryBatch.findUnique({
            where: { id: batchId },
        });

        if (!batch) {
            throw new Error(`Batch ${batchId} not found`);
        }

        if (batch.quantityInStock !== expectedQuantity) {
            throw new Error(
                `Expected batch ${batchId} to have quantity ${expectedQuantity}, but found ${batch.quantityInStock}`
            );
        }
    }

    /**
     * Verify customer balance
     */
    async expectCustomerBalance(patientId: string, expectedBalance: number): Promise<void> {
        const patient = await this.db.patient.findUnique({
            where: { id: patientId },
        });

        if (!patient) {
            throw new Error(`Patient ${patientId} not found`);
        }

        const balance = parseFloat(patient.currentBalance.toString());
        if (balance !== expectedBalance) {
            throw new Error(
                `Expected patient ${patientId} balance to be ${expectedBalance}, but found ${balance}`
            );
        }
    }
}

/**
 * Create database assertions instance
 */
export function createDatabaseAssertions(): DatabaseAssertions {
    return new DatabaseAssertions(getDatabase());
}
