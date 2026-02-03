const prisma = require('../../db/prisma');

class ReturnEligibilityService {
    constructor() {
        this.RETURN_WINDOW_DAYS = 7;
    }

    /**
     * Checks if a specific sale item is eligible for return.
     */
    async checkEligibility(saleItemId, intent, quantityToReturn) {
        const saleItem = await prisma.saleItem.findUnique({
            where: { id: saleItemId },
            include: {
                sale: true,
                drug: true,
                batch: true,
            },
        });

        if (!saleItem) {
            throw new Error('Sale item not found');
        }

        const checks = [];

        // 1. Time Limit Check (7 Days)
        const saleDate = new Date(saleItem.sale.createdAt);
        const daysSinceSale = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceSale > this.RETURN_WINDOW_DAYS) {
            checks.push({ passed: false, reason: `Return window expired. Sold ${Math.floor(daysSinceSale)} days ago.` });
        } else {
            checks.push({ passed: true, reason: 'Within return window' });
        }

        // 2. Quantity Check
        if (quantityToReturn > saleItem.quantity) {
            checks.push({ passed: false, reason: 'Return quantity exceeds sold quantity' });
        } else {
            checks.push({ passed: true });
        }

        // 3. Intent & Condition Check logic
        // Opened items might be rejected if intent is simply "Customer Mind Change"
        // Assuming ReturnIntent is available as string or imported enumerable if needed, but for logic we check value
        if (intent === 'OPENED_UNUSED' && this.itemIsHygieneProduct(saleItem.drug)) {
            checks.push({ passed: false, reason: 'Hygiene products cannot be returned if opened.' });
        }

        const isEligible = checks.every(c => c.passed);
        const failureReasons = checks.filter(c => !c.passed).map(c => c.reason);

        return {
            isEligible,
            reasons: failureReasons,
            itemDetails: {
                name: saleItem.drug.name,
                soldDate: saleItem.sale.createdAt,
                price: saleItem.mrp,
            }
        };
    }

    itemIsHygieneProduct(drug) {
        // Stub logic
        return false;
    }
}

module.exports = new ReturnEligibilityService();
