// NUCLEAR Database Cleanup Script - FAST BULK VERSION
// Deletes ALL data except for protected users and their stores

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Protected entities
const PROTECTED_EMAILS = [
    'globalhopebiotech@gmail.com',
    'hoperxpharma@gmail.com',
    'dikshantjangra1@gmail.com'
];
const PROTECTED_PHONES = ['9812080390'];

async function main() {
    console.log('🧹 FAST NUCLEAR database cleanup...\n');

    try {
        // Step 1: Get protected user and store IDs
        console.log('Step 1: Identifying protected entities...');
        const protectedUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { in: PROTECTED_EMAILS } },
                    { phoneNumber: { in: PROTECTED_PHONES } }
                ]
            },
            select: { id: true, email: true }
        });

        if (protectedUsers.length === 0) {
            console.log('❌ SAFETY: No protected users found. Aborting!');
            return;
        }

        const protectedUserIds = protectedUsers.map(u => u.id);
        console.log(`✅ Protected ${protectedUsers.length} users`);

        const protectedStores = await prisma.storeUser.findMany({
            where: { userId: { in: protectedUserIds } },
            select: { storeId: true }
        });
        const protectedStoreIds = [...new Set(protectedStores.map(s => s.storeId))];
        console.log(`✅ Protected ${protectedStoreIds.length} stores`);

        // Step 2: BULK delete all unprotected data
        console.log('\nStep 2: BULK deleting unprotected data...');

        // Use raw SQL for maximum speed
        const storeIdList = protectedStoreIds.length > 0
            ? `'${protectedStoreIds.join("','")}'`
            : "''";
        const userIdList = protectedUserIds.length > 0
            ? `'${protectedUserIds.join("','")}'`
            : "''";

        // Delete in correct order (children first)
        const deleteQueries = [
            // Sales chain
            `DELETE FROM "IRN" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "InvoiceAllocation" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "PaymentSplit" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "SaleItem" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "SaleRefundItem" WHERE "refundId" IN (SELECT id FROM "SaleRefund" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "SaleRefund" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "Sale" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "SaleDraft" WHERE "storeId" NOT IN (${storeIdList})`,

            // Prescription chain
            `DELETE FROM "PrescriptionFile" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "DispenseItem" WHERE "dispenseEventId" IN (SELECT id FROM "DispenseEvent" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" NOT IN (${storeIdList})))`,
            `DELETE FROM "DispenseEvent" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "PrescriptionItem" WHERE "prescriptionId" IN (SELECT id FROM "Prescription" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "Prescription" WHERE "storeId" NOT IN (${storeIdList})`,

            // GRN chain
            `DELETE FROM "grn_attachments" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "grn_discrepancies" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "GRNItem" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "consolidated_invoice_grns" WHERE "grnId" IN (SELECT id FROM "GoodsReceivedNote" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "GoodsReceivedNote" WHERE "storeId" NOT IN (${storeIdList})`,

            // PO chain
            `DELETE FROM "SupplierReturnItem" WHERE "returnId" IN (SELECT id FROM "SupplierReturn" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "SupplierReturn" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "po_attachments" WHERE "purchaseOrderId" IN (SELECT id FROM "PurchaseOrder" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "POReceipt" WHERE "poId" IN (SELECT id FROM "PurchaseOrder" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "PurchaseOrderItem" WHERE "poId" IN (SELECT id FROM "PurchaseOrder" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "PurchaseOrder" WHERE "storeId" NOT IN (${storeIdList})`,

            // Consolidated Invoices
            `DELETE FROM "consolidated_invoice_items" WHERE "consolidatedInvoiceId" IN (SELECT id FROM "consolidated_invoices" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "consolidated_invoices" WHERE "storeId" NOT IN (${storeIdList})`,

            // Inventory
            `DELETE FROM "StockMovement" WHERE "batchId" IN (SELECT id FROM "InventoryBatch" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "InventoryBatch" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "StockAlert" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "StockAdjustment" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "InventoryCount" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "InventoryForecast" WHERE "storeId" NOT IN (${storeIdList})`,

            // Supplier
            `DELETE FROM "SupplierLicense" WHERE "supplierId" IN (SELECT id FROM "Supplier" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "Supplier" WHERE "storeId" NOT IN (${storeIdList})`,

            // Patient chain
            `DELETE FROM "PatientAudit" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "PatientAdherence" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "PatientInsurance" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "PatientConsent" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "CustomerLedger" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "LoyaltyProfile" WHERE "patientId" IN (SELECT id FROM "Patient" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "Patient" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "Prescriber" WHERE "storeId" NOT IN (${storeIdList})`,

            // WhatsApp
            `DELETE FROM "Message" WHERE "conversationId" IN (SELECT id FROM "Conversation" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "Conversation" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "WhatsAppTemplate" WHERE "whatsappAccountId" IN (SELECT id FROM "WhatsAppAccount" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "WhatsAppOutboundQueue" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "WhatsAppFlow" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "WhatsAppAccount" WHERE "storeId" NOT IN (${storeIdList})`,

            // Communications & Settings
            `DELETE FROM "Campaign" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "EmailAccount" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "HardwareDevice" WHERE "storeId" NOT IN (${storeIdList})`,

            // Admin/HR
            `DELETE FROM "Expense" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "Alert" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "AlertPreference" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "AuditLog" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "AttendanceLog" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "Shift" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "PerformanceMetric" WHERE "storeId" NOT IN (${storeIdList})`,

            // Store Config
            `DELETE FROM "UsageQuota" WHERE "subscriptionId" IN (SELECT id FROM "Subscription" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "Payment" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "Subscription" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "StoreSettings" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "StoreOperatingHours" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "StoreLicense" WHERE "storeId" NOT IN (${storeIdList})`,

            // Users & Roles
            `DELETE FROM "UserRoleAssignment" WHERE "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "RolePermission" WHERE "roleId" IN (SELECT id FROM "Role" WHERE "storeId" NOT IN (${storeIdList}))`,
            `DELETE FROM "Role" WHERE "storeId" IS NOT NULL AND "storeId" NOT IN (${storeIdList})`,
            `DELETE FROM "StoreUser" WHERE "storeId" NOT IN (${storeIdList})`,

            // Delete Stores
            `DELETE FROM "Store" WHERE id NOT IN (${storeIdList})`,

            // Orphaned Users
            `DELETE FROM "OnboardingProgress" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "AdminPin" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "AuditLog" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "AccessLog" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "SavedFilter" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "UserAvatar" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "UserRoleAssignment" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "AttendanceLog" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "StaffDocument" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "PerformanceMetric" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "AlertPreference" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "StoreUser" WHERE "userId" NOT IN (${userIdList})`,
            `DELETE FROM "User" WHERE id NOT IN (${userIdList})`,
        ];

        let count = 0;
        for (const query of deleteQueries) {
            try {
                await prisma.$executeRawUnsafe(query);
                count++;
                if (count % 10 === 0) {
                    process.stdout.write(`  ${count}/${deleteQueries.length} done...\r`);
                }
            } catch (e) {
                // Ignore "table doesn't exist" or "column doesn't exist" errors
                if (!e.message.includes('does not exist') && !e.message.includes('P2021')) {
                    console.log(`  ⚠️ Query ${count}: ${e.message.split('\n')[0]}`);
                }
            }
        }

        console.log(`\n✅ Executed ${count} cleanup queries.`);

        // Verify
        const remainingStores = await prisma.store.count();
        const remainingUsers = await prisma.user.count();
        console.log(`\n📊 Final Count: ${remainingStores} stores, ${remainingUsers} users`);
        console.log('🎉 NUCLEAR cleanup completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
