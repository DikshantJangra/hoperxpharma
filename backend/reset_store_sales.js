/**
 * Store Sales Reset Script
 * 
 * This script resets all sales data for a specific store, including:
 * - Reverting inventory quantities from sold items
 * - Deleting all sales, invoices, and payment records
 * - Resetting prescriptions to their original state
 * 
 * ⚠️  WARNING: This is a DESTRUCTIVE operation and cannot be undone!
 * 
 * Usage: node reset_store_sales.js
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const TARGET_EMAIL = 'globalhopebiotech@gmail.com';

// Counter for tracking operations
const stats = {
    salesDeleted: 0,
    prescriptionsReset: 0,
    inventoryRestored: 0,
    paymentsDeleted: 0,
    saleItemsDeleted: 0
};

/**
 * Create readline interface for user confirmation
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
    const rl = createReadlineInterface();
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

/**
 * Find store by email
 */
async function findStore() {
    console.log(`\n${CYAN}${BOLD}Step 1: Finding Store${RESET}`);
    console.log(`${CYAN}════════════════════════════════════════${RESET}\n`);

    const user = await prisma.user.findUnique({
        where: { email: TARGET_EMAIL },
        include: {
            storeUsers: {
                include: {
                    store: true
                }
            }
        }
    });

    if (!user) {
        throw new Error(`User with email ${TARGET_EMAIL} not found`);
    }

    if (!user.storeUsers || user.storeUsers.length === 0) {
        throw new Error(`No stores found for user ${TARGET_EMAIL}`);
    }

    const store = user.storeUsers[0].store; // Use first store

    console.log(`${GREEN}✓ Found Store:${RESET}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Store: ${store.name}`);
    console.log(`  Store ID: ${store.id}`);

    return store;
}

/**
 * Analyze what will be deleted
 */
async function analyzeData(storeId) {
    console.log(`\n${CYAN}${BOLD}Step 2: Analyzing Data${RESET}`);
    console.log(`${CYAN}════════════════════════════════════════${RESET}\n`);

    // Count sales
    const salesCount = await prisma.sale.count({
        where: { storeId, deletedAt: null }
    });

    // Count sale items
    const saleItemsCount = await prisma.saleItem.count({
        where: { sale: { storeId, deletedAt: null } }
    });

    // Count prescriptions
    const prescriptionsCount = await prisma.prescription.count({
        where: { storeId }
    });

    // Get sample sales with details
    const sampleSales = await prisma.sale.findMany({
        where: { storeId, deletedAt: null },
        include: {
            items: {
                include: {
                    drug: true,
                    batch: true
                }
            },
            paymentSplits: true
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    console.log(`${YELLOW}Data to be processed:${RESET}`);
    console.log(`  • Sales/Invoices: ${salesCount}`);
    console.log(`  • Sale Items: ${saleItemsCount}`);
    console.log(`  • Prescriptions: ${prescriptionsCount}`);

    if (sampleSales.length > 0) {
        console.log(`\n${YELLOW}Sample of recent sales (last 5):${RESET}`);
        for (const sale of sampleSales) {
            console.log(`  ${sale.invoiceNumber} - ₹${sale.total} - ${sale.createdAt.toLocaleDateString()}`);
            console.log(`    Items: ${sale.items.length}, Payments: ${sale.paymentSplits.length}`);
        }
    }

    return { salesCount, saleItemsCount, prescriptionsCount };
}

/**
 * Restore inventory for all sales
 */
async function restoreInventory(storeId) {
    console.log(`\n${CYAN}${BOLD}Step 3: Restoring Inventory${RESET}`);
    console.log(`${CYAN}════════════════════════════════════════${RESET}\n`);

    const sales = await prisma.sale.findMany({
        where: {
            storeId,
            deletedAt: null,
            invoiceType: { not: 'ESTIMATE' } // Only restore for actual sales, not estimates
        },
        include: {
            items: {
                include: {
                    drug: true,
                    batch: true
                }
            }
        }
    });

    console.log(`Processing ${sales.length} sales for inventory restoration...\n`);

    for (const sale of sales) {
        console.log(`Processing: ${sale.invoiceNumber}`);

        for (const item of sale.items) {
            if (!item.batch) {
                console.log(`  ${YELLOW}⚠ Skipping${RESET}: ${item.drug.name} - Batch not found`);
                continue;
            }

            // Restore quantity to batch
            await prisma.inventoryBatch.update({
                where: { id: item.batchId },
                data: {
                    quantityInStock: {
                        increment: item.quantity
                    }
                }
            });

            // Create stock movement record for audit
            await prisma.stockMovement.create({
                data: {
                    batchId: item.batchId,
                    movementType: 'IN',
                    quantity: item.quantity,
                    reason: `Restore from deleted sale: ${sale.invoiceNumber}`,
                    referenceType: 'adjustment'
                }
            });

            console.log(`  ${GREEN}✓ Restored${RESET}: ${item.drug.name} - Batch ${item.batch.batchNumber} (+${item.quantity} units)`);
            stats.inventoryRestored++;
        }
    }

    console.log(`\n${GREEN}✓ Inventory restoration complete: ${stats.inventoryRestored} batches restored${RESET}`);
}

/**
 * Delete all sales data
 */
async function deleteSalesData(storeId) {
    console.log(`\n${CYAN}${BOLD}Step 4: Deleting Sales Data${RESET}`);
    console.log(`${CYAN}════════════════════════════════════════${RESET}\n`);

    // Use transaction for safe deletion
    await prisma.$transaction(async (tx) => {
        // 1. Delete payment splits
        const deletedPayments = await tx.paymentSplit.deleteMany({
            where: {
                sale: {
                    storeId,
                    deletedAt: null
                }
            }
        });
        stats.paymentsDeleted = deletedPayments.count;
        console.log(`${GREEN}✓ Deleted${RESET} ${deletedPayments.count} payment records`);

        // 2. Delete sale items
        const deletedItems = await tx.saleItem.deleteMany({
            where: {
                sale: {
                    storeId,
                    deletedAt: null
                }
            }
        });
        stats.saleItemsDeleted = deletedItems.count;
        console.log(`${GREEN}✓ Deleted${RESET} ${deletedItems.count} sale items`);

        // 3. Delete refund items (if any)
        await tx.saleRefundItem.deleteMany({
            where: {
                refund: {
                    storeId
                }
            }
        });

        // 4. Delete refunds
        await tx.saleRefund.deleteMany({
            where: { storeId }
        });

        // 5. Delete sales
        const deletedSales = await tx.sale.deleteMany({
            where: {
                storeId,
                deletedAt: null
            }
        });
        stats.salesDeleted = deletedSales.count;
        console.log(`${GREEN}✓ Deleted${RESET} ${deletedSales.count} sales/invoices`);

        // 6. Reset customer ledger entries related to sales
        await tx.customerLedger.deleteMany({
            where: {
                storeId,
                referenceType: 'SALE'
            }
        });
        console.log(`${GREEN}✓ Cleared${RESET} customer ledger entries`);

        // 7. Reset patient balances to 0
        await tx.patient.updateMany({
            where: { storeId },
            data: { currentBalance: 0 }
        });
        console.log(`${GREEN}✓ Reset${RESET} patient credit balances to 0`);
    });

    console.log(`\n${GREEN}✓ Sales data deletion complete${RESET}`);
}

/**
 * Reset prescriptions
 */
async function resetPrescriptions(storeId) {
    console.log(`\n${CYAN}${BOLD}Step 5: Resetting Prescriptions${RESET}`);
    console.log(`${CYAN}════════════════════════════════════════${RESET}\n`);

    // Option 1: Delete all prescriptions
    const deleteAll = await askConfirmation(
        `\n${YELLOW}Do you want to DELETE all prescriptions? (yes/no)\n` +
        `  - YES: Permanently delete all prescription records\n` +
        `  - NO: Reset status to PENDING but keep the records\n` +
        `Your choice: ${RESET}`
    );

    if (deleteAll) {
        // Delete related tables in correct order (foreign key constraints)

        // 1. Delete dispense events
        await prisma.dispenseEvent.deleteMany({
            where: {
                prescription: { storeId }
            }
        }).catch(() => { }); // Ignore if no records

        // 2. Delete prescription files
        await prisma.prescriptionFile.deleteMany({
            where: {
                prescription: { storeId }
            }
        });

        // 3. Delete prescription items
        await prisma.prescriptionItem.deleteMany({
            where: {
                prescription: { storeId }
            }
        });

        // 4. Finally delete prescriptions
        const deleted = await prisma.prescription.deleteMany({
            where: { storeId }
        });

        stats.prescriptionsReset = deleted.count;
        console.log(`${GREEN}✓ Deleted${RESET} ${deleted.count} prescriptions permanently`);
    } else {
        // Just reset status
        const updated = await prisma.prescription.updateMany({
            where: { storeId },
            data: {
                status: 'PENDING',
                stage: 'RECEIVED',
                updatedAt: new Date()
            }
        });

        stats.prescriptionsReset = updated.count;
        console.log(`${GREEN}✓ Reset${RESET} ${updated.count} prescriptions to PENDING status`);
    }

    console.log(`\n${GREEN}✓ Prescription processing complete${RESET}`);
}

/**
 * Print final summary
 */
function printSummary() {
    console.log(`\n${BLUE}${BOLD}═══════════════════════════════════════════════════${RESET}`);
    console.log(`${BLUE}${BOLD}                  RESET COMPLETE                   ${RESET}`);
    console.log(`${BLUE}${BOLD}═══════════════════════════════════════════════════${RESET}\n`);

    console.log(`${GREEN}Summary of operations:${RESET}`);
    console.log(`  • Sales Deleted: ${stats.salesDeleted}`);
    console.log(`  • Sale Items Deleted: ${stats.saleItemsDeleted}`);
    console.log(`  • Payments Deleted: ${stats.paymentsDeleted}`);
    console.log(`  • Inventory Batches Restored: ${stats.inventoryRestored}`);
    console.log(`  • Prescriptions Processed: ${stats.prescriptionsReset}`);

    console.log(`\n${GREEN}${BOLD}✓ Store has been reset to a fresh state!${RESET}`);
    console.log(`${GREEN}  You can now start with new sales and prescriptions.${RESET}\n`);
}

/**
 * Main execution
 */
async function main() {
    console.log(`\n${RED}${BOLD}═══════════════════════════════════════════════════${RESET}`);
    console.log(`${RED}${BOLD}         ⚠️  STORE SALES RESET SCRIPT ⚠️          ${RESET}`);
    console.log(`${RED}${BOLD}═══════════════════════════════════════════════════${RESET}\n`);

    console.log(`${YELLOW}This script will:${RESET}`);
    console.log(`  1. Restore inventory quantities from all sales`);
    console.log(`  2. Delete all sales and invoices`);
    console.log(`  3. Delete payment records`);
    console.log(`  4. Reset or delete prescriptions`);
    console.log(`\n${RED}${BOLD}⚠️  WARNING: This operation CANNOT be undone!${RESET}\n`);

    try {
        // Step 1: Find store
        const store = await findStore();

        // Step 2: Analyze what will be affected
        const analysis = await analyzeData(store.id);

        // Ask for confirmation
        const confirmed = await askConfirmation(
            `\n${RED}${BOLD}Are you absolutely sure you want to proceed? (type 'yes' to confirm): ${RESET}`
        );

        if (!confirmed) {
            console.log(`\n${YELLOW}Operation cancelled by user.${RESET}\n`);
            return;
        }

        // Final confirmation
        const finalConfirm = await askConfirmation(
            `\n${RED}${BOLD}FINAL CONFIRMATION: This will delete ${analysis.salesCount} sales. Type 'yes' to proceed: ${RESET}`
        );

        if (!finalConfirm) {
            console.log(`\n${YELLOW}Operation cancelled by user.${RESET}\n`);
            return;
        }

        console.log(`\n${CYAN}${BOLD}Starting reset process...${RESET}\n`);

        // Step 3: Restore inventory
        await restoreInventory(store.id);

        // Step 4: Delete sales data
        await deleteSalesData(store.id);

        // Step 5: Reset prescriptions
        await resetPrescriptions(store.id);

        // Print summary
        printSummary();

    } catch (error) {
        console.error(`\n${RED}${BOLD}Error:${RESET} ${error.message}\n`);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
main();
