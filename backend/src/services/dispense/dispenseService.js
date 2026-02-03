const { PrismaClient } = require('@prisma/client');
const prisma = require('../../db/prisma');

class DispenseService {

    /**
     * Get Dispense Queue (Prescriptions ready to be filled)
     */
    async getDispenseQueue(storeId) {
        // Find DispenseEvents that are active (not COMPLETED or RELEASED)
        const events = await prisma.dispenseEvent.findMany({
            where: {
                prescription: {
                    storeId: storeId
                },
                workflowStatus: {
                    notIn: ['COMPLETED', 'RELEASE']
                }
            },
            include: {
                prescription: {
                    include: {
                        patient: true,
                        prescriber: true,
                        items: {
                            include: { drug: true }
                        }
                    }
                }
            },
            orderBy: [
                { prescription: { priority: 'asc' } }, // UR GENT first (if logic expects Urgent < Normal strings, need to check enum/string value. Usually 'Urgent' comes after 'Normal' alphabetically so desc might be needed if using strings, but let's assume specific sorting logic later if needed. For now default sort.)
                // Wait, 'Urgent' > 'Normal'. 'U' > 'N'. So 'desc' puts Urgent first.
                { createdAt: 'asc' } // Oldest first
            ]
        });

        // Manual sort for priority since it's a string
        return events.sort((a, b) => {
            if (a.prescription.priority === 'Urgent' && b.prescription.priority !== 'Urgent') return -1;
            if (b.prescription.priority === 'Urgent' && a.prescription.priority !== 'Urgent') return 1;
            return 0;
        });
    }

    /**
     * FILL Step: Validate Barcode & Batch
     * This is the "Safety Lock" 🔒
     */
    async fillDispenseItem(dispenseEventId, userId, data) {
        const { dispenseItemId, batchNumber, drugId, quantity } = data;

        // 1. Get the Dispense Event & Validation Data
        const dispenseEvent = await prisma.dispenseEvent.findUnique({
            where: { id: dispenseEventId },
            include: { prescription: { include: { items: true } } }
        });

        if (!dispenseEvent) throw new Error('Dispense event not found');

        // 2. Validate Drug Match (Barcode Check)
        const prescriptionItem = dispenseEvent.prescription.items.find(i => i.drugId === drugId);
        if (!prescriptionItem) {
            throw new Error('SECURITY ALERT: Scanned drug is NOT on this prescription!');
        }

        // 3. Find Inventory Batch
        const batch = await prisma.inventoryBatch.findFirst({
            where: {
                storeId: dispenseEvent.prescription.storeId,
                drugId: drugId,
                batchNumber: batchNumber
            },
            include: {
                drug: true
            }
        });

        if (!batch) throw new Error(`Batch ${batchNumber} not found for this drug.`);

        if (new Date(batch.expiryDate) < new Date()) {
            throw new Error('SAFETY ALERT: This batch is EXPIRED! Do not dispense.');
        }

        if (batch.baseUnitQuantity < quantity) {
            throw new Error(`Insufficient stock in batch. Available: ${batch.baseUnitQuantity}`);
        }

        // 4. Record the Fill (Create/Update DispenseItem)
        return await prisma.$transaction(async (tx) => {

            // Create the record of what was actually put in the bottle
            const dispenseItem = await tx.dispenseItem.create({
                data: {
                    dispenseEventId: dispenseEventId,
                    batchId: batch.id,
                    quantityDispensed: quantity
                },
                include: {
                    batch: {
                        include: {
                            drug: true
                        }
                    }
                }
            });

            // Update Workflow Status to CHECK (Needs verification)
            await tx.dispenseEvent.update({
                where: { id: dispenseEventId },
                data: {
                    workflowStatus: 'CHECK',
                    fillBy: userId,
                    fillAt: new Date()
                }
            });

            return dispenseItem;
        });
    }

    /**
     * RELEASE Step: Finalize and Cleanup
     * Deducts inventory, sends to POS
     */
    async releaseDispense(dispenseEventId, userId) {
        return await prisma.$transaction(async (tx) => {
            const event = await tx.dispenseEvent.findUnique({
                where: { id: dispenseEventId },
                include: {
                    items: {
                        include: {
                            batch: {
                                include: { drug: true }
                            }
                        }
                    },
                    prescription: {
                        include: {
                            patient: true,
                            items: true // Need items for daysSupply calculation
                        }
                    }
                }
            });

            // 1. Deduct Inventory (Real-time stock update)
            for (const item of event.items) {
                await tx.inventoryBatch.update({
                    where: { id: item.batchId },
                    data: {
                        baseUnitQuantity: { decrement: item.quantityDispensed }
                    }
                });

                // Log Stock Movement
                await tx.stockMovement.create({
                    data: {
                        batchId: item.batchId,
                        movementType: 'OUT',
                        quantity: item.quantityDispensed,
                        reason: 'Prescription Dispense',
                        referenceType: 'dispense_event',
                        referenceId: event.id,
                        userId: userId
                    }
                });
            }

            // 2. Update Status to RELEASED
            const updatedEvent = await tx.dispenseEvent.update({
                where: { id: dispenseEventId },
                data: {
                    workflowStatus: 'RELEASE',
                    releaseBy: userId,
                    releaseAt: new Date(),
                    completedAt: new Date()
                }
            });

            // Calculate Next Refill Date (Min of maintenance meds, default 30 days)
            const daysSupplyList = event.prescription.items.map(i => i.daysSupply).filter(d => d);
            const daysSupply = daysSupplyList.length > 0 ? Math.min(...daysSupplyList) : 30; // Default to 30 if null

            const nextRefillDue = new Date();
            nextRefillDue.setDate(nextRefillDue.getDate() + daysSupply);

            // 3. Update Prescription to COMPLETED and set Next Due Date
            await tx.prescription.update({
                where: { id: event.prescriptionId },
                data: {
                    status: 'COMPLETED',
                    nextRefillDue: nextRefillDue
                }
            });

            // 4. Create PENDING Adherence Record for the NEXT refill
            // This allows the system to track when the patient is "due" again
            await tx.patientAdherence.create({
                data: {
                    patientId: event.prescription.patientId,
                    prescriptionId: event.prescriptionId,
                    expectedRefillDate: nextRefillDue,
                    actualRefillDate: null, // Pending status
                    adherenceRate: 1.0 // Default starting score
                }
            });

            // 5. Create Sale Draft in POS (The Handshake 🤝)
            // This makes it appear instantly at the checkout counter
            const saleDraft = await tx.saleDraft.create({
                data: {
                    storeId: event.prescription.storeId,
                    draftNumber: `POS-${Date.now()}`, // Temporary ID
                    customerName: `${event.prescription.patient.firstName} ${event.prescription.patient.lastName}`,
                    customerPhone: event.prescription.patient.phoneNumber,
                    customerId: event.prescription.patientId,
                    createdBy: userId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days

                    // Serialize items for POS
                    items: event.items.map(item => ({
                        drugId: item.batch.drugId,
                        drugName: item.batch.drug.name,
                        batchId: item.batchId,
                        batchNumber: item.batch.batchNumber,
                        quantity: item.quantityDispensed,
                        mrp: item.batch.mrp,
                        gstRate: item.batch.drug.gstRate,
                        discount: 0 // Default, can be applied at POS
                    })),

                    // Calculate totals (Rough estimate, POS recalculates)
                    subtotal: event.items.reduce((sum, item) => sum + (Number(item.batch.mrp) * item.quantityDispensed), 0),
                    taxAmount: 0, // Simplified for now
                    total: event.items.reduce((sum, item) => sum + (Number(item.batch.mrp) * item.quantityDispensed), 0),
                }
            });

            return { updatedEvent, saleDraft };
        });
    }
}

module.exports = new DispenseService();
