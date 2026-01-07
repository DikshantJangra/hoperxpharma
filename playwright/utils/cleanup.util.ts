/**
 * Test Data Cleanup Utilities
 * 
 * Ensures test isolation by cleaning up data after each test
 */

import { PrismaClient } from '@prisma/client';

export class CleanupUtil {
    constructor(private db: PrismaClient) { }

    /**
     * Clean up all test data created during a test
     * Must be called in specific order due to foreign key constraints
     */
    async cleanupTestData(options: {
        userIds?: string[];
        storeIds?: string[];
        patientIds?: string[];
        saleIds?: string[];
        prescriptionIds?: string[];
        poIds?: string[];
        inventoryBatchIds?: string[];
        drugIds?: string[];
        supplierIds?: string[];
    }): Promise<void> {
        const {
            userIds, storeIds, patientIds, saleIds,
            prescriptionIds, poIds, inventoryBatchIds,
            drugIds, supplierIds
        } = options;

        try {
            // Delete in reverse dependency order

            // 1. Sale related (depends on everything)
            if (saleIds && saleIds.length > 0) {
                await this.db.saleItem.deleteMany({
                    where: { saleId: { in: saleIds } },
                });
                await this.db.paymentSplit.deleteMany({
                    where: { saleId: { in: saleIds } },
                });
                await this.db.sale.deleteMany({
                    where: { id: { in: saleIds } },
                });
            }

            // 2. Prescription related
            if (prescriptionIds && prescriptionIds.length > 0) {
                await this.db.prescriptionItem.deleteMany({
                    where: { prescriptionId: { in: prescriptionIds } },
                });
                await this.db.prescription.deleteMany({
                    where: { id: { in: prescriptionIds } },
                });
            }

            // 3. Purchase orders
            if (poIds && poIds.length > 0) {
                const grnIds = await this.getGRNIds(poIds);
                if (grnIds.length > 0) {
                    await this.db.gRNItem.deleteMany({
                        where: { grnId: { in: grnIds } },
                    });
                    await this.db.goodsReceivedNote.deleteMany({
                        where: { poId: { in: poIds } },
                    });
                }
                await this.db.purchaseOrderItem.deleteMany({
                    where: { poId: { in: poIds } },
                });
                await this.db.purchaseOrder.deleteMany({
                    where: { id: { in: poIds } },
                });
            }

            if (storeIds) {
                // Delete store-related data first
                await this.db.inventoryBatch.deleteMany({
                    where: { storeId: { in: storeIds } },
                });
                await this.db.drug.deleteMany({
                    where: { storeId: { in: storeIds } },
                });
                await this.db.supplier.deleteMany({
                    where: { storeId: { in: storeIds } },
                });

                // Delete store users
                await this.db.storeUser.deleteMany({
                    where: { storeId: { in: storeIds } },
                });

                // Finally delete stores
                await this.db.store.deleteMany({
                    where: { id: { in: storeIds } },
                });
            }

            // 6. Users (do last)
            if (userIds) {
                await this.db.user.deleteMany({
                    where: { id: { in: userIds } },
                });
            }
        } catch (error: any) {
            console.error('Cleanup failed:', error);
            throw error;
        }
    }

    /**
     * Delete all records created in the last N minutes (for test cleanup)
     */
    async cleanupRecentRecords(minutesAgo: number = 5): Promise<void> {
        const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);

        // Delete recent sales
        await this.db.sale.deleteMany({
            where: {
                createdAt: { gte: cutoffTime },
                // Only delete test sales (those without real customers or with test indicators)
            },
        });
    }

    /**
     * Clean up test users by email pattern
     */
    async cleanupTestUsers(emailPattern: string = '@automation.com'): Promise<void> {
        const users = await this.db.user.findMany({
            where: {
                email: { contains: emailPattern },
            },
        });

        const userIds = users.map((u: { id: string }) => u.id);

        if (userIds.length > 0) {
            await this.cleanupTestData({ userIds });
        }
    }

    /**
     * Helper: Get GRN IDs for purchase orders
     */
    private async getGRNIds(poIds: string[]): Promise<string[]> {
        const grns = await this.db.goodsReceivedNote.findMany({
            where: { poId: { in: poIds } },
            select: { id: true },
        });
        return grns.map((g: { id: string }) => g.id);
    }
}

/**
 * Create cleanup utility instance
 */
export function createCleanupUtil(db: PrismaClient): CleanupUtil {
    return new CleanupUtil(db);
}
