/**
 * Prescription Aggregate Root
 * Manages prescription lifecycle with state machine
 */

const PrescriptionStatus = {
    DRAFT: 'DRAFT',
    VERIFIED: 'VERIFIED',
    ACTIVE: 'ACTIVE',
    PARTIALLY_DISPENSED: 'PARTIALLY_DISPENSED',
    COMPLETED: 'COMPLETED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED'
};

const PrescriptionType = {
    REGULAR: 'REGULAR',
    CHRONIC: 'CHRONIC',
    EMERGENCY: 'EMERGENCY'
};

class Prescription {
    constructor(data) {
        this.id = data.id;
        this.storeId = data.storeId;
        this.patientId = data.patientId;
        this.doctorId = data.doctorId;

        this.status = data.status || PrescriptionStatus.DRAFT;
        this.type = data.type || PrescriptionType.REGULAR;

        this.prescriptionDate = data.prescriptionDate || new Date();
        this.expiryDate = data.expiryDate;

        // Items (medications)
        this.items = data.items || [];

        // Refill configuration (for chronic)
        this.refillsAllowed = data.refillsAllowed || 0;
        this.refillsRemaining = data.refillsRemaining || 0;

        // Clinical data
        this.diagnosis = data.diagnosis;
        this.notes = data.notes;

        // Audit
        this.createdAt = data.createdAt || new Date();
        this.createdBy = data.createdBy;
        this.verifiedAt = data.verifiedAt;
        this.verifiedBy = data.verifiedBy;

        // Domain events
        this.domainEvents = [];
    }

    // ========== State Machine Methods ==========

    /**
     * Verify prescription (move from DRAFT to VERIFIED)
     */
    verify(userId) {
        this.assertCanTransitionTo(PrescriptionStatus.VERIFIED);

        if (this.items.length === 0) {
            throw new Error('Cannot verify prescription without items');
        }

        this.status = PrescriptionStatus.VERIFIED;
        this.verifiedAt = new Date();
        this.verifiedBy = userId;

        this.raiseEvent({
            type: 'PRESCRIPTION_VERIFIED',
            prescriptionId: this.id,
            verifiedBy: userId,
            timestamp: new Date()
        });
    }

    /**
     * Activate prescription (ready for dispensing)
     */
    activate() {
        this.assertCanTransitionTo(PrescriptionStatus.ACTIVE);

        // Set expiry if not already set (default 30 days)
        if (!this.expiryDate) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            this.expiryDate = expiry;
        }

        this.status = PrescriptionStatus.ACTIVE;

        this.raiseEvent({
            type: 'PRESCRIPTION_ACTIVATED',
            prescriptionId: this.id,
            expiryDate: this.expiryDate,
            timestamp: new Date()
        });
    }

    /**
     * Mark as partially dispensed
     */
    markPartiallyDispensed() {
        if (this.status !== PrescriptionStatus.ACTIVE &&
            this.status !== PrescriptionStatus.PARTIALLY_DISPENSED) {
            throw new Error('Can only dispense from ACTIVE prescriptions');
        }

        this.status = PrescriptionStatus.PARTIALLY_DISPENSED;

        this.raiseEvent({
            type: 'PRESCRIPTION_PARTIALLY_DISPENSED',
            prescriptionId: this.id,
            timestamp: new Date()
        });
    }

    /**
     * Complete prescription (all items dispensed)
     */
    complete() {
        if (this.status !== PrescriptionStatus.ACTIVE &&
            this.status !== PrescriptionStatus.PARTIALLY_DISPENSED) {
            throw new Error('Can only complete ACTIVE or PARTIALLY_DISPENSED prescriptions');
        }

        this.status = PrescriptionStatus.COMPLETED;

        this.raiseEvent({
            type: 'PRESCRIPTION_COMPLETED',
            prescriptionId: this.id,
            timestamp: new Date()
        });
    }

    /**
     * Cancel prescription
     */
    cancel(reason, userId) {
        if (this.status === PrescriptionStatus.COMPLETED) {
            throw new Error('Cannot cancel completed prescription');
        }

        this.status = PrescriptionStatus.CANCELLED;

        this.raiseEvent({
            type: 'PRESCRIPTION_CANCELLED',
            prescriptionId: this.id,
            reason,
            cancelledBy: userId,
            timestamp: new Date()
        });
    }

    /**
     * Mark as expired
     */
    markExpired() {
        if (this.status === PrescriptionStatus.COMPLETED ||
            this.status === PrescriptionStatus.CANCELLED) {
            return; // Already terminal state
        }

        this.status = PrescriptionStatus.EXPIRED;

        this.raiseEvent({
            type: 'PRESCRIPTION_EXPIRED',
            prescriptionId: this.id,
            timestamp: new Date()
        });
    }

    // ========== Business Logic Methods ==========

    /**
     * Check if prescription is expired
     */
    isExpired() {
        if (!this.expiryDate) return false;
        return new Date() > this.expiryDate;
    }

    /**
     * Check if prescription can be dispensed
     */
    canBeDispensed() {
        if (this.isExpired()) return false;

        return this.status === PrescriptionStatus.ACTIVE ||
            this.status === PrescriptionStatus.PARTIALLY_DISPENSED;
    }

    /**
     * Check if refills are available
     */
    hasRefillsAvailable() {
        return this.refillsRemaining > 0;
    }

    /**
     * Consume a refill
     */
    consumeRefill() {
        if (!this.hasRefillsAvailable()) {
            throw new Error('No refills remaining');
        }

        this.refillsRemaining--;

        this.raiseEvent({
            type: 'REFILL_CONSUMED',
            prescriptionId: this.id,
            refillsRemaining: this.refillsRemaining,
            timestamp: new Date()
        });
    }

    /**
     * Add prescription item
     */
    addItem(itemData) {
        if (this.status !== PrescriptionStatus.DRAFT) {
            throw new Error('Can only add items to DRAFT prescriptions');
        }

        this.items.push({
            id: itemData.id,
            drugId: itemData.drugId,
            drugName: itemData.drugName,
            dosage: itemData.dosage,
            frequency: itemData.frequency,
            duration: itemData.duration,
            quantity: itemData.quantity,
            instructions: itemData.instructions
        });
    }

    /**
     * State transition validator
     */
    assertCanTransitionTo(newStatus) {
        const validTransitions = {
            [PrescriptionStatus.DRAFT]: [PrescriptionStatus.VERIFIED, PrescriptionStatus.CANCELLED],
            [PrescriptionStatus.VERIFIED]: [PrescriptionStatus.ACTIVE, PrescriptionStatus.CANCELLED],
            [PrescriptionStatus.ACTIVE]: [
                PrescriptionStatus.PARTIALLY_DISPENSED,
                PrescriptionStatus.COMPLETED,
                PrescriptionStatus.EXPIRED,
                PrescriptionStatus.CANCELLED
            ],
            [PrescriptionStatus.PARTIALLY_DISPENSED]: [
                PrescriptionStatus.COMPLETED,
                PrescriptionStatus.EXPIRED,
                PrescriptionStatus.CANCELLED
            ],
            [PrescriptionStatus.COMPLETED]: [],
            [PrescriptionStatus.EXPIRED]: [],
            [PrescriptionStatus.CANCELLED]: []
        };

        const allowed = validTransitions[this.status] || [];

        if (!allowed.includes(newStatus)) {
            throw new Error(
                `Invalid state transition: ${this.status} -> ${newStatus}`
            );
        }
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

    toPrisma() {
        return {
            id: this.id,
            storeId: this.storeId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            status: this.status,
            type: this.type,
            prescriptionDate: this.prescriptionDate,
            expiryDate: this.expiryDate,
            refillsAllowed: this.refillsAllowed,
            refillsRemaining: this.refillsRemaining,
            diagnosis: this.diagnosis,
            notes: this.notes,
            verifiedAt: this.verifiedAt,
            verifiedBy: this.verifiedBy
        };
    }

    toDTO() {
        return {
            id: this.id,
            storeId: this.storeId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            status: this.status,
            type: this.type,
            prescriptionDate: this.prescriptionDate.toISOString(),
            expiryDate: this.expiryDate?.toISOString(),
            items: this.items,
            refillsAllowed: this.refillsAllowed,
            refillsRemaining: this.refillsRemaining,
            diagnosis: this.diagnosis,
            notes: this.notes,
            canBeDispensed: this.canBeDispensed(),
            isExpired: this.isExpired(),
            hasRefills: this.hasRefillsAvailable(),
            verifiedAt: this.verifiedAt?.toISOString(),
            verifiedBy: this.verifiedBy,
            createdAt: this.createdAt.toISOString(),
            createdBy: this.createdBy
        };
    }

    toJSON() {
        return this.toDTO();
    }
}

module.exports = { Prescription, PrescriptionStatus, PrescriptionType };
