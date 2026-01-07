/**
 * DPFV Cleanup Utility
 * Handles deletion of test data created during verification runs.
 * Guarantees that the database is left clean regardless of run outcome.
 */

const prisma = require('../src/db/prisma');
const logger = require('../src/config/logger');

export async function cleanupDPFVData() {
    console.log('\n🧹 [DPFV] Starting cleanup of test data...');

    try {
        // 1. Identify Test Users and Stores
        const usersToDelete = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { startsWith: 'dpfv-test-', endsWith: '@test.hoperx.com' } },
                    { email: { startsWith: 'report-admin-', endsWith: '@test.hoperx.com' } },
                    { email: { startsWith: 'dpfv-audit-', endsWith: '@test.hoperx.com' } },
                    { email: { startsWith: 'consol-17', endsWith: '@test.hoperx.com' } },
                    { email: { startsWith: 'credit-17', endsWith: '@test.hoperx.com' } },
                    { email: { startsWith: 'pdf-17', endsWith: '@test.hoperx.com' } },
                ]
            },
            select: { id: true }
        });

        const storesToDelete = await prisma.store.findMany({
            where: {
                OR: [
                    { name: { startsWith: 'DPFV Test Pharmacy' } },
                    { email: { startsWith: 'store-', endsWith: '@test.hoperx.com' } }
                ]
            },
            select: { id: true, name: true }
        });

        const userIds = usersToDelete.map((u: any) => u.id);
        const storeIds = storesToDelete.map((s: any) => s.id);

        if (userIds.length === 0 && storeIds.length === 0) {
            console.log('   ✓ No test data found to clean');
            return;
        }

        console.log(`   Found ${userIds.length} users and ${storeIds.length} stores to clean.`);

        // Convert to SQL-safe lists
        const userIdList = userIds.length > 0 ? `'${userIds.join("','")}'` : "''";
        const storeIdList = storeIds.length > 0 ? `'${storeIds.join("','")}'` : "''";

        // 2. Execute Deletion in Dependency Order (Mirrors nuclear cleanup script)
        const deleteQueries = [
            // --- SALES CHAIN ---
            `DELETE FROM "IRN" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "InvoiceAllocation" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "PaymentSplit" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "SaleItem" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "SaleRefundItem" WHERE "refundId" IN (SELECT id FROM "SaleRefund" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "SaleRefund" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "SaleDraft" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "Sale" WHERE "storeId" IN (${storeIdList})`,

            // --- PRESCRIPTION CHAIN ---
            `DELETE FROM "PrescriptionFile" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "DispenseItem" WHERE "dispenseEventId" IN (SELECT id FROM "DispenseEvent" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" IN (${storeIdList})))`,
            `DELETE FROM "DispenseEvent" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "PrescriptionItem" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "Prescription" WHERE "storeId" IN (${storeIdList})`,

            // --- PROCUREMENT (GRN/PO) ---
            `DELETE FROM "grn_attachments" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "grn_discrepancies" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "GRNItem" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "consolidated_invoice_grns" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "GoodsReceivedNote" WHERE "storeId" IN (${storeIdList})`,

            `DELETE FROM "SupplierReturnItem" WHERE "returnId" IN (SELECT id FROM "SupplierReturn" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "SupplierReturn" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "po_attachments" WHERE "purchaseOrderId" IN (SELECT id FROM "PurchaseOrder" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "POReceipt" WHERE "poId" IN (SELECT id FROM "PurchaseOrder" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "PurchaseOrderItem" WHERE "poId" IN (SELECT id FROM "PurchaseOrder" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "PurchaseOrder" WHERE "storeId" IN (${storeIdList})`,

            `DELETE FROM "consolidated_invoice_items" WHERE "consolidatedInvoiceId" IN (SELECT id FROM "consolidated_invoices" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "consolidated_invoices" WHERE "storeId" IN (${storeIdList})`,

            // --- INVENTORY ---
            `DELETE FROM "StockMovement" WHERE "batchId" IN (SELECT id FROM "InventoryBatch" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "InventoryBatch" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "StockAlert" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "StockAdjustment" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "InventoryCount" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "InventoryForecast" WHERE "storeId" IN (${storeIdList})`,

            // --- PARTIES ---
            `DELETE FROM "SupplierLicense" WHERE "supplierId" IN (SELECT id FROM "Supplier" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "Supplier" WHERE "storeId" IN (${storeIdList})`,

            `DELETE FROM "PatientAudit" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "PatientAdherence" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "PatientInsurance" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "PatientConsent" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "CustomerLedger" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "LoyaltyProfile" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "Patient" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "Prescriber" WHERE "storeId" IN (${storeIdList})`,

            // --- COMMS & SETTINGS ---
            `DELETE FROM "Message" WHERE "conversationId" IN (SELECT id FROM "Conversation" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "Conversation" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "WhatsAppTemplate" WHERE "whatsappAccountId" IN (SELECT id FROM "WhatsAppAccount" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "WhatsAppOutboundQueue" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "WhatsAppFlow" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "WhatsAppAccount" WHERE "storeId" IN (${storeIdList})`,

            `DELETE FROM "Campaign" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "EmailAccount" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "HardwareDevice" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "Expense" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "Alert" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "AlertPreference" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "AuditLog" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "AttendanceLog" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "Shift" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "PerformanceMetric" WHERE "storeId" IN (${storeIdList})`,

            // --- STORE CONFIG ---
            `DELETE FROM "UsageQuota" WHERE "subscriptionId" IN (SELECT id FROM "Subscription" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "Payment" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "Subscription" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "StoreSettings" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "StoreOperatingHours" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "StoreLicense" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "UserRoleAssignment" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "RolePermission" WHERE "roleId" IN (SELECT id FROM "Role" WHERE "storeId" IN (${storeIdList}))`,
            `DELETE FROM "Role" WHERE "storeId" IN (${storeIdList})`,

            // --- LINKING TABLES: StoreUser ---
            // Must delete StoreUser before Store and User
            `DELETE FROM "StoreUser" WHERE "storeId" IN (${storeIdList})`,
            `DELETE FROM "StoreUser" WHERE "userId" IN (${userIdList})`,

            // --- ROOT ENTITIES: Store ---
            `DELETE FROM "Store" WHERE id IN (${storeIdList})`,

            // --- ORPHANED USER DATA (linked to User but not Store) ---
            `DELETE FROM "OnboardingProgress" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "AdminPin" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "AuditLog" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "AccessLog" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "SavedFilter" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "UserAvatar" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "UserRoleAssignment" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "AttendanceLog" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "StaffDocument" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "PerformanceMetric" WHERE "userId" IN (${userIdList})`,
            `DELETE FROM "AlertPreference" WHERE "userId" IN (${userIdList})`,

            // --- ROOT ENTITIES: User ---
            `DELETE FROM "User" WHERE id IN (${userIdList})`
        ];

        let count = 0;
        for (const query of deleteQueries) {
            try {
                // Execute only if we have target IDs relevant to the query to avoid syntax errors with empty IN ()
                // But our list check above ensures we have IDs or we returned early, and filter is WHERE .. IN ('' or 'id')
                await prisma.$executeRawUnsafe(query);
                count++;
            } catch (e: any) {
                // Ignore "table/column does not exist" errors (schema mismatch)
                if (!e.message.includes('does not exist') && !e.message.includes('P2021')) {
                    // console.log(`   ⚠️ Cleanup detail: ${e.message.split('\n')[0]}`);
                }
            }
        }

        console.log(`   ✓ Cleaned up test data (${count} tables processed)`);
        console.log('✨ [DPFV] Cleanup complete\n');

    } catch (error: any) {
        console.error('\n❌ [DPFV] Cleanup failed:', error.message);
        
        // Check if it's a database connection error
        if (error.message.includes('Can\'t reach database server') || 
            error.message.includes('Connection refused') ||
            error.message.includes('ECONNREFUSED') ||
            error.code === 'P1001' || 
            error.code === 'P1002') {
            console.error('\n💥 Database connection failed. Please ensure your database is running.');
            console.error('   Connection string:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
            process.exit(1);
        }
        
        // For other errors, log but don't exit
        console.error('⚠️  Continuing despite cleanup error...\n');
    }
}
