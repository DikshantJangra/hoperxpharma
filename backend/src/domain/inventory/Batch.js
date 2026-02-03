/**
 * Batch Aggregate Root
 * Core domain entity for inventory management
 * Encapsulates all business rules related to stock batches
 */

const BatchNumber = require('./valueObjects/BatchNumber');
const { Quantity, Unit } = require('../shared/valueObjects/Quantity');
const Money = require('../shared/valueObjects/Money');
const {
    InsufficientStockError,
    ExpiredBatchError
} = require('../shared/errors/DomainErrors');

class Batch {
    constructor(data) {
        this.id = data.id;
        this.batchNumber = data.batchNumber instanceof BatchNumber
            ? data.batchNumber
            : new BatchNumber(data.batchNumber);

        this.drugId = data.drugId;
        this.drugName = data.drugName || data.drug?.name;

        this.expiryDate = data.expiryDate instanceof Date
            ? data.expiryDate
            : new Date(data.expiryDate);

        this.costPrice = data.costPrice instanceof Money
            ? data.costPrice
            : new Money(data.costPrice || data.purchasePrice || 0);

        this.sellingPrice = data.sellingPrice instanceof Money
            ? data.sellingPrice
            : new Money(data.sellingPrice || data.mrp || 0);

        this.storeId = data.storeId;
        this.supplierId = data.supplierId;
        this.supplier = data.supplier;

        // Multi-unit support - baseUnitQuantity is the source of truth
        this.receivedUnit = (data.receivedUnit || data.unit || 'TABLET').toUpperCase();
        this.tabletsPerStrip = data.tabletsPerStrip || 1;

        // baseUnitQuantity can be passed directly or calculated from quantity if provided during creation
        if (data.baseUnitQuantity !== undefined) {
            this.baseUnitQuantity = Number(data.baseUnitQuantity);
        } else {
            const quantityValue = Number(data.quantity || 0);
            this.baseUnitQuantity = (this.receivedUnit === 'STRIP' || this.receivedUnit === 'BOX' || this.receivedUnit === 'BOTTLE')
                ? quantityValue * this.tabletsPerStrip
                : quantityValue;
        }

        this.location = data.location || null;

        // Domain events
        this.domainEvents = [];
    }

    /**
     * Computed property - get quantity in received unit
     */
    getQuantityInReceivedUnit() {
        if (this.receivedUnit === 'STRIP' || this.receivedUnit === 'BOX' || this.receivedUnit === 'BOTTLE') {
            return Math.floor(this.baseUnitQuantity / this.tabletsPerStrip);
        }
        return this.baseUnitQuantity;
    }

    /**
     * Factory method to create from Prisma data
     */
    static fromPrisma(prismaData) {
        return new Batch({
            id: prismaData.id,
            batchNumber: prismaData.batchNumber,
            drugId: prismaData.drugId,
            drugName: prismaData.drug?.name,
            baseUnitQuantity: prismaData.baseUnitQuantity || 0,
            receivedUnit: prismaData.receivedUnit,
            tabletsPerStrip: prismaData.tabletsPerStrip,
            expiryDate: prismaData.expiryDate,
            costPrice: prismaData.purchasePrice,
            sellingPrice: prismaData.mrp,
            storeId: prismaData.storeId,
            supplierId: prismaData.supplierId,
            supplier: prismaData.supplier,
            location: prismaData.location
        });
    }

    // ========== Business Logic Methods ==========

    /**
     * Check if this batch can fulfill a requested quantity (in base units)
     */
    canFulfill(requestedQtyInBaseUnits) {
        // Business Rule 1: Cannot dispense from expired batch
        if (this.isExpired()) {
            throw new ExpiredBatchError(this.batchNumber, this.expiryDate);
        }

        // Business Rule 2: Must have sufficient stock
        return this.baseUnitQuantity >= requestedQtyInBaseUnits;
    }

    /**
     * Deduct stock from this batch (always in base units)
     */
    deduct(qtyInBaseUnits, reason, userId) {
        if (!this.canFulfill(qtyInBaseUnits)) {
            throw new InsufficientStockError(
                this.drugName,
                `${this.baseUnitQuantity} base units`,
                `${qtyInBaseUnits} base units`
            );
        }

        const oldBaseQty = this.baseUnitQuantity;
        this.baseUnitQuantity -= qtyInBaseUnits;

        // Emit domain event
        this.raiseEvent({
            type: 'STOCK_DEDUCTED',
            batchId: this.id,
            batchNumber: this.batchNumber.toString(),
            drugName: this.drugName,
            baseUnitQuantity: qtyInBaseUnits,
            oldBaseUnitQuantity: oldBaseQty,
            newBaseUnitQuantity: this.baseUnitQuantity,
            reason,
            userId,
            timestamp: new Date()
        });

        return qtyInBaseUnits;
    }

    /**
     * Add stock to this batch (always in base units)
     */
    add(qtyInBaseUnits, reason, userId) {
        const oldBaseQty = this.baseUnitQuantity;
        this.baseUnitQuantity += qtyInBaseUnits;

        this.raiseEvent({
            type: 'STOCK_ADDED',
            batchId: this.id,
            baseUnitQuantity: qtyInBaseUnits,
            oldBaseUnitQuantity: oldBaseQty,
            newBaseUnitQuantity: this.baseUnitQuantity,
            reason,
            userId,
            timestamp: new Date()
        });

        return qtyInBaseUnits;
    }

    /**
     * Check if batch is expired
     */
    isExpired() {
        return this.expiryDate <= new Date();
    }

    /**
     * Check if batch is expiring soon (within specified days)
     */
    isExpiringSoon(daysAhead = 90) {
        if (this.isExpired()) return false;

        const threshold = new Date();
        threshold.setDate(threshold.getDate() + daysAhead);

        return this.expiryDate <= threshold;
    }

    /**
     * Calculate margin for this batch
     */
    calculateMargin() {
        return this.sellingPrice.subtract(this.costPrice);
    }

    /**
     * Calculate margin percentage
     */
    calculateMarginPercentage() {
        if (this.costPrice.isZero()) return 0;

        const margin = this.calculateMargin();
        return (margin.getAmount() / this.costPrice.getAmount()) * 100;
    }

    /**
     * Get expiry status as enum
     */
    getExpiryStatus() {
        if (this.isExpired()) return 'EXPIRED';
        if (this.isExpiringSoon(30)) return 'EXPIRING_SOON'; // 30 days
        if (this.isExpiringSoon(90)) return 'EXPIRING_WARNING'; // 90 days
        return 'VALID';
    }

    /**
     * Check if batch is low on stock (using base units threshold)
     */
    isLowStock(thresholdInBaseUnits = 10) {
        return this.baseUnitQuantity <= thresholdInBaseUnits;
    }

    /**
     * Get display quantity string
     */
    getDisplayQuantity() {
        const qty = this.getQuantityInReceivedUnit();
        const unit = this.receivedUnit.charAt(0) + this.receivedUnit.slice(1).toLowerCase();
        return `${qty} ${unit}${qty !== 1 ? 's' : ''}`;
    }

    // ========== Domain Events ==========

    raiseEvent(event) {
        this.domainEvents.push(event);
    }

    clearEvents() {
        const events = [...this.domainEvents];
        this.domainEvents = [];
        return events;
    }

    getDomainEvents() {
        return [...this.domainEvents];
    }

    // ========== Data Mapping ==========

    /**
     * Convert to Prisma format for persistence
     */
    toPrisma() {
        return {
            id: this.id,
            batchNumber: this.batchNumber.toPrisma(),
            drugId: this.drugId,
            baseUnitQuantity: this.baseUnitQuantity,
            receivedUnit: this.receivedUnit,
            tabletsPerStrip: this.tabletsPerStrip,
            expiryDate: this.expiryDate,
            purchasePrice: this.costPrice.toPrisma(), // MAPS TO DB purchasePrice
            mrp: this.sellingPrice.toPrisma(),
            storeId: this.storeId,
            supplierId: this.supplierId,
            location: this.location
        };
    }

    /**
     * Convert to DTO for API responses
     */
    toDTO() {
        const quantityInReceivedUnit = this.getQuantityInReceivedUnit();
        return {
            id: this.id,
            batchNumber: this.batchNumber.toString(),
            drugId: this.drugId,
            drugName: this.drugName,
            displayQuantity: this.getDisplayQuantity(),
            expiryDate: this.expiryDate.toISOString(),
            expiryStatus: this.getExpiryStatus(),
            costPrice: this.costPrice.toJSON(),
            sellingPrice: this.sellingPrice.toJSON(),
            margin: this.calculateMargin().toJSON(),
            marginPercentage: this.calculateMarginPercentage(),
            storeId: this.storeId,
            supplierId: this.supplierId,
            supplier: this.supplier,
            location: this.location,
            receivedUnit: this.receivedUnit,
            tabletsPerStrip: this.tabletsPerStrip,
            baseUnitQuantity: this.baseUnitQuantity
        };
    }

    toJSON() {
        return this.toDTO();
    }
}

module.exports = Batch;
