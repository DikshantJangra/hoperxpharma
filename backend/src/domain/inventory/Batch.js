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

        this.quantity = data.quantity instanceof Quantity
            ? data.quantity
            : new Quantity(data.quantity || data.quantityInStock, data.unit || Unit.TABLET);

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

        // Multi-unit support
        this.receivedUnit = data.unit || data.receivedUnit || 'Tablet';
        this.tabletsPerStrip = data.tabletsPerStrip || null;
        this.baseUnitQuantity = data.baseUnitQuantity ||
            (this.receivedUnit === 'Strip' && this.tabletsPerStrip
                ? this.quantity.getValue() * this.tabletsPerStrip
                : this.quantity.getValue());

        this.location = data.location || null;

        // Domain events
        this.domainEvents = [];
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
            quantity: prismaData.quantityInStock,
            unit: prismaData.receivedUnit || 'Tablet',
            baseUnitQuantity: prismaData.baseUnitQuantity,
            tabletsPerStrip: prismaData.tabletsPerStrip,
            expiryDate: prismaData.expiryDate,
            costPrice: prismaData.purchasePrice, // Map from DB purchasePrice
            sellingPrice: prismaData.mrp,
            storeId: prismaData.storeId,
            supplierId: prismaData.supplierId,
            supplier: prismaData.supplier,
            location: prismaData.location
        });
    }

    // ========== Business Logic Methods ==========

    /**
     * Check if this batch can fulfill a requested quantity
     * Enforces business rules: not expired, sufficient stock
     */
    canFulfill(requestedQty) {
        if (!(requestedQty instanceof Quantity)) {
            requestedQty = new Quantity(requestedQty, this.quantity.getUnit());
        }

        // Business Rule 1: Cannot dispense from expired batch
        if (this.isExpired()) {
            throw new ExpiredBatchError(this.batchNumber, this.expiryDate);
        }

        // Business Rule 2: Must have sufficient stock
        return this.quantity.isGreaterThanOrEqual(requestedQty);
    }

    /**
     * Deduct stock from this batch
     * Returns the deducted quantity for audit trail
     */
    deduct(qty, reason, userId) {
        if (!(qty instanceof Quantity)) {
            qty = new Quantity(qty, this.quantity.getUnit());
        }

        if (!this.canFulfill(qty)) {
            throw new InsufficientStockError(
                this.drugName,
                this.quantity.toString(),
                qty.toString()
            );
        }

        const oldQuantity = this.quantity;
        this.quantity = this.quantity.subtract(qty);

        // Emit domain event
        this.raiseEvent({
            type: 'STOCK_DEDUCTED',
            batchId: this.id,
            batchNumber: this.batchNumber.toString(),
            drugName: this.drugName,
            quantity: qty.toJSON(),
            oldQuantity: oldQuantity.toJSON(),
            newQuantity: this.quantity.toJSON(),
            reason,
            userId,
            timestamp: new Date()
        });

        return qty;
    }

    /**
     * Add stock to this batch
     * Used for stock adjustments, returns, etc.
     */
    add(qty, reason, userId) {
        if (!(qty instanceof Quantity)) {
            qty = new Quantity(qty, this.quantity.getUnit());
        }

        const oldQuantity = this.quantity;
        this.quantity = this.quantity.add(qty);

        this.raiseEvent({
            type: 'STOCK_ADDED',
            batchId: this.id,
            quantity: qty.toJSON(),
            oldQuantity: oldQuantity.toJSON(),
            newQuantity: this.quantity.toJSON(),
            reason,
            userId,
            timestamp: new Date()
        });

        return qty;
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
     * Check if batch is low on stock
     */
    isLowStock(threshold = 10) {
        return this.quantity.getValue() <= threshold;
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
            quantityInStock: this.quantity.getValue(),
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
        return {
            id: this.id,
            batchNumber: this.batchNumber.toString(),
            drugId: this.drugId,
            drugName: this.drugName,
            quantity: this.quantity.toJSON(),
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
