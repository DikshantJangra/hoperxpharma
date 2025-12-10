const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_STORE_EMAIL = 'globalhopebiotech@gmail.com';

async function main() {
    console.log('🧹 Starting database cleanup...\n');
    console.log(`Target store email: ${TARGET_STORE_EMAIL}\n`);

    try {
        // Step 1: Find the target store
        console.log('Step 1: Finding target store...');
        const targetStore = await prisma.store.findUnique({
            where: { email: TARGET_STORE_EMAIL },
            include: {
                users: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!targetStore) {
            throw new Error(`❌ Store with email ${TARGET_STORE_EMAIL} not found!`);
        }

        console.log(`✅ Found target store: ${targetStore.name} (ID: ${targetStore.id})\n`);

        // Get user IDs associated with the target store
        const targetStoreUserIds = targetStore.users.map(su => su.userId);
        console.log(`Target store has ${targetStoreUserIds.length} associated users\n`);

        // Step 2: Find all other stores
        console.log('Step 2: Finding stores to delete...');
        const storesToDelete = await prisma.store.findMany({
            where: {
                id: {
                    not: targetStore.id
                }
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        console.log(`Found ${storesToDelete.length} stores to delete:`);
        storesToDelete.forEach(store => {
            console.log(`  - ${store.name} (${store.email})`);
        });
        console.log('');

        if (storesToDelete.length === 0) {
            console.log('✅ No other stores to delete. Database is already clean!\n');
        } else {
            // Step 3: Delete all related data for each store before deleting the store
            console.log('Step 3: Deleting stores and their related data...\n');

            for (const store of storesToDelete) {
                console.log(`  Processing store: ${store.name}...`);

                // Delete in order to respect foreign key constraints

                // 1. Delete Prescriptions and related data
                const prescriptions = await prisma.prescription.findMany({
                    where: { storeId: store.id },
                    select: { id: true }
                });

                if (prescriptions.length > 0) {
                    const prescriptionIds = prescriptions.map(p => p.id);

                    // Delete prescription files
                    await prisma.prescriptionFile.deleteMany({
                        where: { prescriptionId: { in: prescriptionIds } }
                    });

                    // Delete dispense events and items
                    const dispenseEvents = await prisma.dispenseEvent.findMany({
                        where: { prescriptionId: { in: prescriptionIds } },
                        select: { id: true }
                    });

                    if (dispenseEvents.length > 0) {
                        await prisma.dispenseItem.deleteMany({
                            where: { dispenseEventId: { in: dispenseEvents.map(d => d.id) } }
                        });
                        await prisma.dispenseEvent.deleteMany({
                            where: { prescriptionId: { in: prescriptionIds } }
                        });
                    }

                    // Delete prescription items
                    await prisma.prescriptionItem.deleteMany({
                        where: { prescriptionId: { in: prescriptionIds } }
                    });

                    // Delete prescriptions
                    await prisma.prescription.deleteMany({
                        where: { id: { in: prescriptionIds } }
                    });

                    console.log(`    ✅ Deleted ${prescriptions.length} prescriptions`);
                }

                // 2. Delete Sales and related data
                const sales = await prisma.sale.findMany({
                    where: { storeId: store.id },
                    select: { id: true }
                });

                if (sales.length > 0) {
                    const saleIds = sales.map(s => s.id);

                    // Delete invoice allocations
                    await prisma.invoiceAllocation.deleteMany({
                        where: { saleId: { in: saleIds } }
                    });

                    // Delete payment splits
                    await prisma.paymentSplit.deleteMany({
                        where: { saleId: { in: saleIds } }
                    });

                    // Delete sale items
                    await prisma.saleItem.deleteMany({
                        where: { saleId: { in: saleIds } }
                    });

                    // Delete sale refunds and items
                    const refunds = await prisma.saleRefund.findMany({
                        where: { storeId: store.id },
                        select: { id: true }
                    });

                    if (refunds.length > 0) {
                        await prisma.saleRefundItem.deleteMany({
                            where: { refundId: { in: refunds.map(r => r.id) } }
                        });
                        await prisma.saleRefund.deleteMany({
                            where: { id: { in: refunds.map(r => r.id) } }
                        });
                    }

                    // Delete IRN records
                    await prisma.iRN.deleteMany({
                        where: { saleId: { in: saleIds } }
                    });

                    // Delete sales
                    await prisma.sale.deleteMany({
                        where: { id: { in: saleIds } }
                    });

                    console.log(`    ✅ Deleted ${sales.length} sales`);
                }

                // 3. Delete Purchase Orders and related data
                const purchaseOrders = await prisma.purchaseOrder.findMany({
                    where: { storeId: store.id },
                    select: { id: true }
                });

                if (purchaseOrders.length > 0) {
                    const poIds = purchaseOrders.map(po => po.id);

                    // Delete GRNs and related data
                    const grns = await prisma.goodsReceivedNote.findMany({
                        where: { poId: { in: poIds } },
                        select: { id: true }
                    });

                    if (grns.length > 0) {
                        const grnIds = grns.map(g => g.id);

                        // Delete consolidated invoice GRNs
                        await prisma.consolidatedInvoiceGRN.deleteMany({
                            where: { grnId: { in: grnIds } }
                        });

                        // Delete GRN attachments
                        await prisma.gRNAttachment.deleteMany({
                            where: { grnId: { in: grnIds } }
                        });

                        // Delete GRN discrepancies
                        await prisma.gRNDiscrepancy.deleteMany({
                            where: { grnId: { in: grnIds } }
                        });

                        // Delete GRN items
                        await prisma.gRNItem.deleteMany({
                            where: { grnId: { in: grnIds } }
                        });

                        // Delete GRNs
                        await prisma.goodsReceivedNote.deleteMany({
                            where: { id: { in: grnIds } }
                        });
                    }

                    // Delete supplier returns
                    const returns = await prisma.supplierReturn.findMany({
                        where: { poId: { in: poIds } },
                        select: { id: true }
                    });

                    if (returns.length > 0) {
                        await prisma.supplierReturnItem.deleteMany({
                            where: { returnId: { in: returns.map(r => r.id) } }
                        });
                        await prisma.supplierReturn.deleteMany({
                            where: { id: { in: returns.map(r => r.id) } }
                        });
                    }

                    // Delete PO attachments
                    await prisma.pOAttachment.deleteMany({
                        where: { purchaseOrderId: { in: poIds } }
                    });

                    // Delete PO receipts
                    await prisma.pOReceipt.deleteMany({
                        where: { poId: { in: poIds } }
                    });

                    // Delete PO items
                    await prisma.purchaseOrderItem.deleteMany({
                        where: { poId: { in: poIds } }
                    });

                    // Delete purchase orders
                    await prisma.purchaseOrder.deleteMany({
                        where: { id: { in: poIds } }
                    });

                    console.log(`    ✅ Deleted ${purchaseOrders.length} purchase orders`);
                }

                // 4. Delete Consolidated Invoices
                const consolidatedInvoices = await prisma.consolidatedInvoice.findMany({
                    where: { storeId: store.id },
                    select: { id: true }
                });

                if (consolidatedInvoices.length > 0) {
                    const invoiceIds = consolidatedInvoices.map(ci => ci.id);

                    await prisma.consolidatedInvoiceItem.deleteMany({
                        where: { consolidatedInvoiceId: { in: invoiceIds } }
                    });

                    await prisma.consolidatedInvoice.deleteMany({
                        where: { id: { in: invoiceIds } }
                    });

                    console.log(`    ✅ Deleted ${consolidatedInvoices.length} consolidated invoices`);
                }

                // 5. Delete Inventory and related data
                const inventoryBatches = await prisma.inventoryBatch.findMany({
                    where: { storeId: store.id },
                    select: { id: true }
                });

                if (inventoryBatches.length > 0) {
                    const batchIds = inventoryBatches.map(b => b.id);

                    // Delete stock movements
                    await prisma.stockMovement.deleteMany({
                        where: { batchId: { in: batchIds } }
                    });

                    // Delete inventory batches
                    await prisma.inventoryBatch.deleteMany({
                        where: { id: { in: batchIds } }
                    });

                    console.log(`    ✅ Deleted ${inventoryBatches.length} inventory batches`);
                }

                // 6. Delete Suppliers (suppliers are store-specific)
                const deletedSuppliers = await prisma.supplier.deleteMany({
                    where: { storeId: store.id }
                });

                if (deletedSuppliers.count > 0) {
                    console.log(`    ✅ Deleted ${deletedSuppliers.count} suppliers`);
                }

                // 6.5. Transfer drugs to target store (since drugs may be shared via inventory batches)
                // This prevents cascade delete issues when deleting the store
                const drugsToTransfer = await prisma.drug.updateMany({
                    where: { storeId: store.id },
                    data: { storeId: targetStore.id }
                });

                if (drugsToTransfer.count > 0) {
                    console.log(`    ℹ️  Transferred ${drugsToTransfer.count} drugs to target store`);
                }

                // 7. Delete Patients and related data
                const patients = await prisma.patient.findMany({
                    where: { storeId: store.id },
                    select: { id: true }
                });

                if (patients.length > 0) {
                    const patientIds = patients.map(p => p.id);

                    // Delete customer ledger
                    await prisma.customerLedger.deleteMany({
                        where: { patientId: { in: patientIds } }
                    });

                    // Delete patient audit logs
                    await prisma.patientAudit.deleteMany({
                        where: { patientId: { in: patientIds } }
                    });

                    // Delete patient adherence
                    await prisma.patientAdherence.deleteMany({
                        where: { patientId: { in: patientIds } }
                    });

                    // Delete patient insurance
                    await prisma.patientInsurance.deleteMany({
                        where: { patientId: { in: patientIds } }
                    });

                    // Delete patient consents
                    await prisma.patientConsent.deleteMany({
                        where: { patientId: { in: patientIds } }
                    });

                    // Delete patients
                    await prisma.patient.deleteMany({
                        where: { id: { in: patientIds } }
                    });

                    console.log(`    ✅ Deleted ${patients.length} patients`);
                }

                // 9. Delete Prescribers
                await prisma.prescriber.deleteMany({
                    where: { storeId: store.id }
                });

                // 10. Delete WhatsApp data
                const whatsappAccount = await prisma.whatsAppAccount.findUnique({
                    where: { storeId: store.id },
                    select: { id: true }
                });

                if (whatsappAccount) {
                    const conversations = await prisma.conversation.findMany({
                        where: { storeId: store.id },
                        select: { id: true }
                    });

                    if (conversations.length > 0) {
                        await prisma.message.deleteMany({
                            where: { conversationId: { in: conversations.map(c => c.id) } }
                        });
                        await prisma.conversation.deleteMany({
                            where: { id: { in: conversations.map(c => c.id) } }
                        });
                    }

                    await prisma.whatsAppTemplate.deleteMany({
                        where: { whatsappAccountId: whatsappAccount.id }
                    });

                    await prisma.whatsAppAccount.delete({
                        where: { id: whatsappAccount.id }
                    });
                }

                // 11. Delete Campaigns
                await prisma.campaign.deleteMany({
                    where: { storeId: store.id }
                });

                // 12. Delete Expenses
                await prisma.expense.deleteMany({
                    where: { storeId: store.id }
                });

                // 13. Delete Sale Drafts
                await prisma.saleDraft.deleteMany({
                    where: { storeId: store.id }
                });

                // 14. Delete Alerts
                await prisma.alert.deleteMany({
                    where: { storeId: store.id }
                });

                // 15. Delete Audit Logs
                await prisma.auditLog.deleteMany({
                    where: { storeId: store.id }
                });

                // 16. Delete HR data
                await prisma.attendanceLog.deleteMany({
                    where: { storeId: store.id }
                });

                await prisma.shift.deleteMany({
                    where: { storeId: store.id }
                });

                await prisma.performanceMetric.deleteMany({
                    where: { storeId: store.id }
                });

                // 17. Delete custom roles
                await prisma.role.deleteMany({
                    where: { storeId: store.id }
                });

                // 18. Delete user role assignments
                await prisma.userRoleAssignment.deleteMany({
                    where: { storeId: store.id }
                });

                // 19. Delete store users
                await prisma.storeUser.deleteMany({
                    where: { storeId: store.id }
                });

                // Now delete the store (cascade will handle remaining relations)
                await prisma.store.delete({
                    where: { id: store.id }
                });

                console.log(`  ✅ Deleted store: ${store.name}\n`);
            }
        }
        // Step 4: Clean up orphaned users (users not associated with the target store)
        console.log('Step 4: Finding orphaned users...');
        const orphanedUsers = await prisma.user.findMany({
            where: {
                id: {
                    notIn: targetStoreUserIds
                }
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
            }
        });

        console.log(`Found ${orphanedUsers.length} orphaned users to delete:`);
        orphanedUsers.forEach(user => {
            console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
        });
        console.log('');

        if (orphanedUsers.length > 0) {
            console.log('Deleting orphaned users...');
            for (const user of orphanedUsers) {
                // Delete access logs first
                await prisma.accessLog.deleteMany({
                    where: { userId: user.id }
                });

                // Delete saved filters
                await prisma.savedFilter.deleteMany({
                    where: { userId: user.id }
                });

                // Delete user avatars
                await prisma.userAvatar.deleteMany({
                    where: { userId: user.id }
                });

                // Now delete the user
                await prisma.user.delete({
                    where: { id: user.id }
                });
                console.log(`  ✅ Deleted user: ${user.email}`);
            }
            console.log('');
        }

        // Step 5: Clean up global data that might not be store-specific
        console.log('Step 5: Cleaning up global data...');

        // Clean up InteractionCheckLog for non-existent stores
        const deletedInteractionLogs = await prisma.interactionCheckLog.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedInteractionLogs.count} interaction check logs`);

        // Clean up StockAlert for non-existent stores
        const deletedStockAlerts = await prisma.stockAlert.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedStockAlerts.count} stock alerts`);

        // Clean up StockAdjustment for non-existent stores
        const deletedStockAdjustments = await prisma.stockAdjustment.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedStockAdjustments.count} stock adjustments`);

        // Clean up InventoryCount for non-existent stores
        const deletedInventoryCounts = await prisma.inventoryCount.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedInventoryCounts.count} inventory counts`);

        // Clean up InventoryForecast for non-existent stores
        const deletedInventoryForecasts = await prisma.inventoryForecast.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedInventoryForecasts.count} inventory forecasts`);

        // Clean up DispenseWorkflowStep for non-existent stores
        const deletedWorkflowSteps = await prisma.dispenseWorkflowStep.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedWorkflowSteps.count} dispense workflow steps`);

        // Clean up POTemplate for non-existent stores
        const deletedPOTemplates = await prisma.pOTemplate.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedPOTemplates.count} PO templates`);

        // Clean up Claim for non-existent stores
        const deletedClaims = await prisma.claim.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedClaims.count} claims`);

        // Clean up Reconciliation for non-existent stores
        const deletedReconciliations = await prisma.reconciliation.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedReconciliations.count} reconciliations`);

        // Clean up OCRJob for non-existent stores
        const deletedOCRJobs = await prisma.oCRJob.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedOCRJobs.count} OCR jobs`);

        // Clean up BankAccount for non-existent stores
        const deletedBankAccounts = await prisma.bankAccount.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedBankAccounts.count} bank accounts`);

        // Clean up PaymentGateway for non-existent stores
        const deletedPaymentGateways = await prisma.paymentGateway.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedPaymentGateways.count} payment gateways`);

        // Clean up GSTReturn for non-existent stores
        const deletedGSTReturns = await prisma.gSTReturn.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedGSTReturns.count} GST returns`);

        // Clean up GSTTransaction for non-existent stores
        const deletedGSTTransactions = await prisma.gSTTransaction.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedGSTTransactions.count} GST transactions`);

        // Clean up ComplianceCheck for non-existent stores
        const deletedComplianceChecks = await prisma.complianceCheck.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedComplianceChecks.count} compliance checks`);

        // Clean up WhatsAppOutboundQueue for non-existent stores
        const deletedWhatsAppQueue = await prisma.whatsAppOutboundQueue.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedWhatsAppQueue.count} WhatsApp outbound queue items`);

        // Clean up WhatsAppFlow for non-existent stores
        const deletedWhatsAppFlows = await prisma.whatsAppFlow.deleteMany({
            where: {
                storeId: {
                    not: targetStore.id
                }
            }
        });
        console.log(`  ✅ Deleted ${deletedWhatsAppFlows.count} WhatsApp flows`);

        console.log('');

        // Step 6: Verification
        console.log('Step 6: Verifying cleanup...');
        const remainingStores = await prisma.store.count();
        const remainingUsers = await prisma.user.count();

        console.log(`  Remaining stores: ${remainingStores}`);
        console.log(`  Remaining users: ${remainingUsers}`);
        console.log('');

        if (remainingStores === 1) {
            console.log('✅ Database cleanup completed successfully!');
            console.log(`✅ Only ${targetStore.name} (${TARGET_STORE_EMAIL}) remains with all its data intact.\n`);
        } else {
            console.log('⚠️  Warning: Expected 1 store but found ' + remainingStores);
        }

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
