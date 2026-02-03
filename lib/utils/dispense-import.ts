// Helper function to import dispense into POS basket
// This ensures clinical data is locked while financial data is editable

export const importDispenseToBasket = async (dispense: any, inventoryApi: any) => {
    const prescription = dispense.refill?.prescription;
    const patient = prescription?.patient;
    const prescriptionVersion = dispense.prescriptionVersion;
    const medications = prescriptionVersion?.items || [];

    // Build basket items from dispense
    const basketItems: any[] = [];
    const warnings: string[] = [];

    for (const item of medications) {
        try {
            const drugId = item.drugId || item.drug?.id;
            if (!drugId) continue;

            // Fetch available batches for this drug
            const batchResponse = await inventoryApi.getBatches({
                drugId,
                limit: 100,
                minQuantity: 1
            });

            const batches = (batchResponse as any).data || (batchResponse as any).batches || [];
            const validBatches = batches.filter((b: any) => Number(b.baseUnitQuantity) > 0);

            if (validBatches.length === 0) {
                warnings.push(`${item.drug?.name || 'Unknown'} is out of stock`);
                continue;
            }

            // Use prescribed batch if available, otherwise FEFO
            let selectedBatch = null;
            if (item.batchId) {
                selectedBatch = validBatches.find((b: any) => b.id === item.batchId);
            }

            if (!selectedBatch) {
                // FEFO: Sort by expiry date
                validBatches.sort((a: any, b: any) =>
                    new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                );
                selectedBatch = validBatches[0];

                if (item.batchId) {
                    warnings.push(
                        `${item.drug?.name}: Prescribed batch unavailable, using FEFO batch ${selectedBatch.batchNumber}`
                    );
                }
            }

            if (selectedBatch) {
                const qtyPrescribed = Number(item.quantityPrescribed) || 1;
                const availableStock = Number(selectedBatch.baseUnitQuantity);
                const qtyToAdd = Math.min(qtyPrescribed, availableStock);

                basketItems.push({
                    id: drugId,
                    name: item.drug?.name || 'Unknown',
                    sku: item.drug?.sku || drugId,
                    batchId: selectedBatch.id,
                    batchNumber: selectedBatch.batchNumber,
                    location: selectedBatch.location,
                    expiryDate: selectedBatch.expiryDate,
                    stock: availableStock,
                    totalStock: availableStock,
                    mrp: Number(selectedBatch.mrp),
                    qty: qtyToAdd,
                    discount: 0, // Editable in POS
                    gstRate: Number(item.drug?.gstRate) || 5,
                    type: 'DISPENSE',
                    // Clinical data (locked) - metadata only, not editable in POS
                    _clinical: {
                        sig: item.sig,
                        daysSupply: item.daysSupply,
                        substitutionAllowed: item.substitutionAllowed,
                        isControlled: item.isControlled,
                        prescribedQty: qtyPrescribed,
                    },
                });

                if (qtyToAdd < qtyPrescribed) {
                    warnings.push(
                        `${item.drug?.name}: Only ${qtyToAdd} of ${qtyPrescribed} units available`
                    );
                }
            }
        } catch (error) {
            console.error('[DispenseImport] Error processing item:', item.drug?.name, error);
            warnings.push(`Failed to load ${item.drug?.name || 'Unknown'}`);
        }
    }

    return {
        basketItems,
        customer: patient ? {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            phoneNumber: patient.phoneNumber,
            email: patient.email,
            currentBalance: patient.currentBalance,
        } : null,
        dispenseId: dispense.id,
        prescriptionId: prescription?.id,
        prescriptionNumber: prescription?.prescriptionNumber,
        refillInfo: {
            refillNumber: dispense.refill?.refillNumber,
            authorizedQty: dispense.refill?.authorizedQty,
        },
        warnings,
    };
};

// Helper to create sale from dispense
export const createSaleFromDispense = async (
    dispenseId: string,
    saleData: any,
    salesApi: any
) => {
    try {
        // Use new API endpoint that creates from dispense
        const response = await salesApi.createSaleFromDispense(dispenseId, saleData);
        return response;
    } catch (error) {
        console.error('[DispenseImport] Sale creation error:', error);
        throw error;
    }
};
