/**
 * StockMovement Entity
 * Represents a single stock transaction (in/out/adjustment)
 * Provides audit trail for all inventory changes
 */

const { Quantity, Unit } = require('../shared/valueObjects/Quantity');

const MovementType = {
    IN: 'IN',           // Stock received (GRN, adjustment, return)
    OUT: 'OUT',         // Stock sold or dispensed
    ADJUSTMENT: 'ADJUSTMENT', // Manual adjustment
    TRANSFER: 'TRANSFER',     // Inter-store transfer
    DAMAGED: 'DAMAGED',       // Stock damaged/expired
    RETURN: 'RETURN'          // Customer return
};

const ReferenceType = {
    GRN: 'grn',
    SALE: 'sale',
    ADJUSTMENT: 'adjustment',
    TRANSFER: 'transfer',
    MANUAL: 'manual'
};

class StockMovement {
    constructor(data) {
        this.id = data.id;
        this.batchId = data.batchId;

        this.movementType = data.movementType;
        this.quantity = data.quantity instanceof Quantity
            ? data.quantity
            : new Quantity(Math.abs(data.quantity), data.unit || Unit.TABLET);

        // Reference to source transaction
        this.referenceType = data.referenceType;
        this.referenceId = data.referenceId;

        // Reason/notes
        this.reason = data.reason;
        this.notes = data.notes;

        // Audit
        this.userId = data.userId;
        this.timestamp = data.timestamp || new Date();

        // Snapshot of stock levels at time of movement
        this.balanceBefore = data.balanceBefore;
        this.balanceAfter = data.balanceAfter;
    }

    static fromPrisma(prismaData) {
        return new StockMovement({
            id: prismaData.id,
            batchId: prismaData.batchId,
            movementType: prismaData.movementType,
            quantity: Math.abs(prismaData.quantity), // Always store as positive
            unit: Unit.TABLET,
            referenceType: prismaData.referenceType,
            referenceId: prismaData.referenceId,
            reason: prismaData.reason,
            notes: prismaData.notes,
            userId: prismaData.userId,
            timestamp: prismaData.createdAt,
            balanceBefore: prismaData.balanceBefore,
            balanceAfter: prismaData.balanceAfter
        });
    }

    /**
     * Create stock movement for GRN receipt
     */
    static createForGRN(batchId, quantity, grnNumber, userId) {
        return new StockMovement({
            batchId,
            movementType: MovementType.IN,
            quantity,
            referenceType: ReferenceType.GRN,
            referenceId: grnNumber,
            reason: `Stock received via GRN ${grnNumber}`,
            userId
        });
    }

    /**
     * Create stock movement for sale
     */
    static createForSale(batchId, quantity, invoiceNumber, userId) {
        return new StockMovement({
            batchId,
            movementType: MovementType.OUT,
            quantity,
            referenceType: ReferenceType.SALE,
            referenceId: invoiceNumber,
            reason: `Sold via invoice ${invoiceNumber}`,
            userId
        });
    }

    /**
     * Create stock movement for manual adjustment
     */
    static createAdjustment(batchId, quantity, reason, userId, notes = null) {
        const type = quantity.getValue() > 0 ? MovementType.IN : MovementType.OUT;

        return new StockMovement({
            batchId,
            movementType: type,
            quantity: new Quantity(Math.abs(quantity.getValue()), quantity.getUnit()),
            referenceType: ReferenceType.ADJUSTMENT,
            referenceId: null,
            reason,
            notes,
            userId
        });
    }

    // ========== Business Logic Methods ==========

    /**
     * Check if this is an incoming movement
     */
    isIncoming() {
        return [MovementType.IN, MovementType.RETURN].includes(this.movementType);
    }

    /**
     * Check if this is an outgoing movement
     */
    isOutgoing() {
        return [MovementType.OUT, MovementType.DAMAGED, MovementType.TRANSFER].includes(this.movementType);
    }

    /**
     * Get signed quantity (positive for IN, negative for OUT)
     */
    getSignedQuantity() {
        const value = this.quantity.getValue();
        return this.isIncoming() ? value : -value;
    }

    /**
     * Set balance snapshots
     */
    setBalances(before, after) {
        this.balanceBefore = before;
        this.balanceAfter = after;
    }

    /**
     * Validate movement
     */
    validate() {
        if (!this.batchId) {
            throw new Error('Batch ID is required for stock movement');
        }

        if (!this.movementType) {
            throw new Error('Movement type is required');
        }

        if (this.quantity.getValue() <= 0) {
            throw new Error('Quantity must be positive');
        }

        if (!this.userId) {
            throw new Error('User ID is required for audit trail');
        }
    }

    // ========== Data Mapping ==========

    toPrisma() {
        return {
            id: this.id,
            batchId: this.batchId,
            movementType: this.movementType,
            quantity: this.getSignedQuantity(), // Store with sign
            referenceType: this.referenceType,
            referenceId: this.referenceId,
            reason: this.reason,
            notes: this.notes,
            userId: this.userId,
            balanceBefore: this.balanceBefore,
            balanceAfter: this.balanceAfter
        };
    }

    toDTO() {
        return {
            id: this.id,
            batchId: this.batchId,
            movementType: this.movementType,
            quantity: this.quantity.toJSON(),
            signedQuantity: this.getSignedQuantity(),
            referenceType: this.referenceType,
            referenceId: this.referenceId,
            reason: this.reason,
            notes: this.notes,
            userId: this.userId,
            timestamp: this.timestamp.toISOString(),
            balanceBefore: this.balanceBefore,
            balanceAfter: this.balanceAfter,
            isIncoming: this.isIncoming(),
            isOutgoing: this.isOutgoing()
        };
    }

    toJSON() {
        return this.toDTO();
    }
}

module.exports = { StockMovement, MovementType, ReferenceType };
