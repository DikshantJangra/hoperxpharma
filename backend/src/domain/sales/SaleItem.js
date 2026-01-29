/**
 * SaleItem Entity
 * Represents a line item in a sale
 */

const { Quantity, Unit } = require('../shared/valueObjects/Quantity');
const Money = require('../shared/valueObjects/Money');

class SaleItem {
    constructor(data) {
        this.id = data.id;
        this.saleId = data.saleId;

        // Product info
        this.drugId = data.drugId;
        this.drugName = data.drugName;
        this.batchId = data.batchId;
        this.batchNumber = data.batchNumber;

        // Quantity & pricing
        this.quantity = data.quantity instanceof Quantity
            ? data.quantity
            : new Quantity(data.quantity, data.unit || Unit.TABLET);

        this.price = data.price instanceof Money
            ? data.price
            : new Money(data.price);

        this.discount = data.discount || 0; // Percentage
        this.gstRate = data.gstRate || 0;

        // Clinical data (optional, from prescription)
        this.dosage = data.dosage;
        this.frequency = data.frequency;
        this.duration = data.duration;
        this.instructions = data.instructions;
    }

    static fromPrisma(prismaData) {
        return new SaleItem({
            id: prismaData.id,
            saleId: prismaData.saleId,
            drugId: prismaData.drugId,
            drugName: prismaData.drug?.name,
            batchId: prismaData.batchId,
            batchNumber: prismaData.batch?.batchNumber,
            quantity: prismaData.quantity,
            unit: Unit.TABLET,
            price: prismaData.price,
            discount: prismaData.discount,
            gstRate: prismaData.gstRate,
            dosage: prismaData.dosage,
            frequency: prismaData.frequency,
            duration: prismaData.duration,
            instructions: prismaData.instructions
        });
    }

    // ========== Business Logic Methods ==========

    /**
     * Calculate gross amount (before discount)
     */
    getGrossAmount() {
        return this.price.multiply(this.quantity.getValue());
    }

    /**
     * Calculate discount amount
     */
    getDiscountAmount() {
        return this.getGrossAmount().applyPercentage(this.discount);
    }

    /**
     * Calculate taxable amount (after discount, before tax)
     */
    getTaxableAmount() {
        return this.getGrossAmount().subtract(this.getDiscountAmount());
    }

    /**
     * Calculate tax amount
     */
    getTaxAmount() {
        return this.getTaxableAmount().applyPercentage(this.gstRate);
    }

    /**
     * Calculate line total (final amount including all)
     */
    getLineTotal() {
        return this.getTaxableAmount().add(this.getTaxAmount());
    }

    /**
     * Check if this is a prescription item
     */
    isPrescriptionItem() {
        return !!(this.dosage || this.frequency || this.duration);
    }

    /**
     * Validate item
     */
    validate() {
        if (this.quantity.getValue() <= 0) {
            throw new Error('Item quantity must be positive');
        }

        if (this.price.getAmount() < 0) {
            throw new Error('Item price cannot be negative');
        }

        if (this.discount < 0 || this.discount > 100) {
            throw new Error('Discount must be between 0 and 100');
        }
    }

    // ========== Data Mapping ==========

    toPrisma() {
        return {
            id: this.id,
            saleId: this.saleId,
            drugId: this.drugId,
            batchId: this.batchId,
            quantity: this.quantity.getValue(),
            price: this.price.toPrisma(),
            discount: this.discount,
            gstRate: this.gstRate,
            dosage: this.dosage,
            frequency: this.frequency,
            duration: this.duration,
            instructions: this.instructions
        };
    }

    toDTO() {
        return {
            id: this.id,
            drugId: this.drugId,
            drugName: this.drugName,
            batchId: this.batchId,
            batchNumber: this.batchNumber,
            quantity: this.quantity.toJSON(),
            price: this.price.toJSON(),
            discount: this.discount,
            gstRate: this.gstRate,
            grossAmount: this.getGrossAmount().toJSON(),
            discountAmount: this.getDiscountAmount().toJSON(),
            taxableAmount: this.getTaxableAmount().toJSON(),
            taxAmount: this.getTaxAmount().toJSON(),
            lineTotal: this.getLineTotal().toJSON(),
            isPrescription: this.isPrescriptionItem(),
            // Clinical data if present
            ...(this.isPrescriptionItem() && {
                dosage: this.dosage,
                frequency: this.frequency,
                duration: this.duration,
                instructions: this.instructions
            })
        };
    }

    toJSON() {
        return this.toDTO();
    }
}

module.exports = SaleItem;
