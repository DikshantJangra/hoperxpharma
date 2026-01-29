/**
 * GST Calculation Service
 * Extracted from SaleService to handle all tax-related calculations
 */

const gstCalculator = require('../../utils/gstCalculator');
const gstRepository = require('../../repositories/gstRepository');
const configService = require('../configService');
const logger = require('../../config/logger');

class GSTCalculationService {
    /**
     * Compute GST for sale items based on store configuration
     */
    async computeGSTForItems(items, storeId) {
        try {
            // Get store GST configuration
            const storeSettings = await configService.getStoreSettings(storeId);

            if (!storeSettings || !storeSettings.gstEnabled) {
                logger.info('[GST] GST disabled for store, skipping calculation');
                return items; // Return items unchanged
            }

            const { stateCode } = storeSettings;

            // Get customer state if available (from first item's metadata or default to store state)
            const customerState = items[0]?.customerState || stateCode;

            // Determine tax type (Intra-state vs Inter-state)
            const isIntraState = stateCode === customerState;

            logger.info('[GST] Computing GST', {
                storeState: stateCode,
                customerState,
                isIntraState,
                itemCount: items.length
            });

            // Calculate GST for each item
            const enrichedItems = items.map(item => {
                const {
                    drugId,
                    drugName,
                    quantity,
                    price,
                    discount = 0,
                    gstRate
                } = item;

                // Calculate taxable amount (after discount)
                const grossAmount = quantity * price;
                const discountAmount = (grossAmount * discount) / 100;
                const taxableAmount = grossAmount - discountAmount;

                // Calculate GST breakdown
                let cgst = 0;
                let sgst = 0;
                let igst = 0;

                if (isIntraState) {
                    // Intra-state: CGST + SGST
                    cgst = (taxableAmount * gstRate) / 200; // Half of GST rate
                    sgst = (taxableAmount * gstRate) / 200; // Half of GST rate
                } else {
                    // Inter-state: IGST
                    igst = (taxableAmount * gstRate) / 100; // Full GST rate
                }

                const totalTax = cgst + sgst + igst;
                const finalAmount = taxableAmount + totalTax;

                return {
                    ...item,
                    grossAmount,
                    discountAmount,
                    taxableAmount,
                    cgst,
                    sgst,
                    igst,
                    totalTax,
                    finalAmount,
                    gstBreakdown: {
                        rate: gstRate,
                        cgst,
                        sgst,
                        igst,
                        total: totalTax,
                        isIntraState
                    }
                };
            });

            return enrichedItems;
        } catch (error) {
            logger.error('[GST] Failed to compute GST', error);
            throw error;
        }
    }

    /**
     * Enrich sale data with GST totals and breakdown
     */
    async enrichSaleDataWithGST(saleData, storeId) {
        try {
            const { items } = saleData;

            // Compute GST for all items
            const enrichedItems = await this.computeGSTForItems(items, storeId);

            // Calculate totals
            const totals = enrichedItems.reduce(
                (acc, item) => ({
                    subtotal: acc.subtotal + item.grossAmount,
                    discount: acc.discount + item.discountAmount,
                    taxable: acc.taxable + item.taxableAmount,
                    cgst: acc.cgst + item.cgst,
                    sgst: acc.sgst + item.sgst,
                    igst: acc.igst + item.igst,
                    totalTax: acc.totalTax + item.totalTax,
                    grandTotal: acc.grandTotal + item.finalAmount
                }),
                {
                    subtotal: 0,
                    discount: 0,
                    taxable: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    totalTax: 0,
                    grandTotal: 0
                }
            );

            // Round amounts to 2 decimal places
            Object.keys(totals).forEach(key => {
                totals[key] = parseFloat(totals[key].toFixed(2));
            });

            return {
                ...saleData,
                items: enrichedItems,
                gstTotals: totals,
                gstEnabled: true
            };
        } catch (error) {
            logger.error('[GST] Failed to enrich sale data', error);
            // Return original data if GST enrichment fails
            return {
                ...saleData,
                gstEnabled: false
            };
        }
    }

    /**
     * Create GST ledger entry for a sale
     */
    async createGSTLedgerEntry(saleId, storeId, gstTotals) {
        try {
            if (!gstTotals || gstTotals.totalTax === 0) {
                logger.info('[GST] No tax to record for sale', { saleId });
                return null;
            }

            const entry = await gstRepository.createGSTEntry({
                saleId,
                storeId,
                cgst: gstTotals.cgst,
                sgst: gstTotals.sgst,
                igst: gstTotals.igst,
                totalTax: gstTotals.totalTax,
                taxableAmount: gstTotals.taxable,
                entryDate: new Date()
            });

            logger.info('[GST] Ledger entry created', { saleId, entryId: entry.id });
            return entry;
        } catch (error) {
            logger.error('[GST] Failed to create ledger entry', error);
            throw error;
        }
    }

    /**
     * Calculate tax strategy for a given transaction
     */
    async getTaxStrategy(storeState, customerState) {
        const isIntraState = storeState === customerState;

        return {
            type: isIntraState ? 'INTRA_STATE' : 'INTER_STATE',
            components: isIntraState ? ['CGST', 'SGST'] : ['IGST'],
            isIntraState
        };
    }
}

module.exports = new GSTCalculationService();
