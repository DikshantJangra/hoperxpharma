const prisma = require('../../db/prisma');
const logger = require('../../config/logger');
const ApiError = require('../../utils/ApiError');

/**
 * Simplified Retail Dispense Service
 * Bypasses complex hospital workflow - one-step dispense via POS
 */
class RetailDispenseService {
    /**
     * Dispense prescription directly via POS sale
     * This is a simplified workflow for retail pharmacies
     */
    async dispensePrescriptionRetail(prescriptionId, saleData, userId) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Validate prescription exists and is active
                const prescription = await tx.prescription.findUnique({
                    where: { id: prescriptionId },
                    include: {
                        prescriptionItems: {
                            include: {
                                drug: true,
                            },
                        },
                        refills: {
                            where: { status: 'AVAILABLE' },
                            orderBy: { number: 'asc' },
                            take: 1,
                        },
                    },
                });

                if (!prescription) {
                    throw ApiError.notFound('Prescription not found');
                }

                if (prescription.status !== 'ACTIVE') {
                    throw ApiError.badRequest(`Prescription status is ${prescription.status}, cannot dispense`);
                }

                // Check if prescription has expired
                if (new Date(prescription.expiryDate) < new Date()) {
                    throw ApiError.badRequest('Prescription has expired');
                }

                // 2. Get available refill
                const availableRefill = prescription.refills[0];
                if (!availableRefill) {
                    throw ApiError.badRequest('No available refills for this prescription');
                }

                // 3. Validate sale items match prescription items
                const saleItems = saleData.items;
                for (const saleItem of saleItems) {
                    const prescribedItem = prescription.prescriptionItems.find(
                        (pi) => pi.drugId === saleItem.drugId
                    );

                    if (!prescribedItem) {
                        throw ApiError.badRequest(`Drug ${saleItem.drugId} is not in the prescription`);
                    }

                    // Check quantity doesn't exceed prescribed amount
                    if (saleItem.quantity > prescribedItem.quantityPrescribed) {
                        throw ApiError.badRequest(
                            `Quantity for ${prescribedItem.drug.name} exceeds prescribed amount`
                        );
                    }
                }

                // 4. Create the sale (using existing sale service logic would go here)
                // For now, we'll update the refill status

                // 5. Update refill status
                await tx.refill.update({
                    where: { id: availableRefill.id },
                    data: {
                        status: 'FULLY_USED',
                        filledDate: new Date(),
                        filledBy: userId,
                    },
                });

                // 6. Update refill items
                for (const saleItem of saleItems) {
                    const prescribedItem = prescription.prescriptionItems.find(
                        (pi) => pi.drugId === saleItem.drugId
                    );

                    await tx.refillItem.create({
                        data: {
                            refillId: availableRefill.id,
                            prescriptionItemId: prescribedItem.id,
                            quantityDispensed: saleItem.quantity,
                            batchId: saleItem.batchId,
                        },
                    });
                }

                // 7. Check if all refills used - mark prescription as completed
                const remainingRefills = await tx.refill.count({
                    where: {
                        prescriptionId,
                        status: 'AVAILABLE',
                    },
                });

                if (remainingRefills === 0) {
                    await tx.prescription.update({
                        where: { id: prescriptionId },
                        data: { status: 'COMPLETED' },
                    });
                }

                logger.info(`Prescription ${prescriptionId} dispensed via retail POS by user ${userId}`);

                return {
                    prescription,
                    refill: availableRefill,
                    dispensedAt: new Date(),
                };
            });
        } catch (error) {
            logger.error('Error dispensing prescription (retail):', error);
            throw error;
        }
    }

    /**
     * Get prescription details for POS integration
     */
    async getPrescriptionForPOS(prescriptionId) {
        try {
            const prescription = await prisma.prescription.findUnique({
                where: { id: prescriptionId },
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                        },
                    },
                    prescriber: {
                        select: {
                            name: true,
                            licenseNumber: true,
                        },
                    },
                    prescriptionItems: {
                        include: {
                            drug: {
                                select: {
                                    id: true,
                                    name: true,
                                    genericName: true,
                                    form: true,
                                    strength: true,
                                    mrp: true,
                                },
                            },
                            batch: {
                                select: {
                                    id: true,
                                    batchNumber: true,
                                    expiryDate: true,
                                    mrp: true,
                                    baseUnitQuantity: true,
                                },
                            },
                        },
                    },
                    refills: {
                        where: { status: 'AVAILABLE' },
                        select: {
                            id: true,
                            number: true,
                            status: true,
                        },
                        orderBy: { number: 'asc' },
                    },
                },
            });

            if (!prescription) {
                throw ApiError.notFound('Prescription not found');
            }

            // Transform to POS-friendly format
            const posItems = prescription.prescriptionItems.map((item) => ({
                drugId: item.drug.id,
                drugName: item.drug.name,
                genericName: item.drug.genericName,
                form: item.drug.form,
                strength: item.drug.strength,
                quantityPrescribed: item.quantityPrescribed,
                sig: item.sig,
                daysSupply: item.daysSupply,
                mrp: item.drug.mrp,
                batchId: item.batchId,
                batch: item.batch,
            }));

            return {
                prescriptionId: prescription.id,
                prescriptionNumber: prescription.prescriptionNumber,
                patient: prescription.patient,
                prescriber: prescription.prescriber,
                issueDate: prescription.issueDate,
                expiryDate: prescription.expiryDate,
                status: prescription.status,
                availableRefills: prescription.refills.length,
                items: posItems,
            };
        } catch (error) {
            logger.error('Error getting prescription for POS:', error);
            throw error;
        }
    }
}

module.exports = new RetailDispenseService();
