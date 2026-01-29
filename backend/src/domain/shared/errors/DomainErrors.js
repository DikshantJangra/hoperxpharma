/**
 * Domain Errors
 * Base class and specific domain exceptions
 */

class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class InsufficientStockError extends DomainError {
    constructor(drugName, available, required) {
        super(
            `Insufficient stock for ${drugName}. Available: ${available}, Required: ${required}`
        );
        this.drugName = drugName;
        this.available = available;
        this.required = required;
    }
}

class ExpiredBatchError extends DomainError {
    constructor(batchNumber, expiryDate) {
        super(`Batch ${batchNumber} expired on ${expiryDate.toDateString()}`);
        this.batchNumber = batchNumber;
        this.expiryDate = expiryDate;
    }
}

class InvalidStateTransitionError extends DomainError {
    constructor(fromState, toState) {
        super(`Invalid state transition from ${fromState} to ${toState}`);
        this.fromState = fromState;
        this.toState = toState;
    }
}

class CurrencyMismatchError extends DomainError {
    constructor(currency1, currency2) {
        super(`Currency mismatch: ${currency1} vs ${currency2}`);
        this.currency1 = currency1;
        this.currency2 = currency2;
    }
}

class PaymentMismatchError extends DomainError {
    constructor(expectedAmount, receivedAmount) {
        super(
            `Payment mismatch. Expected: ${expectedAmount}, Received: ${receivedAmount}`
        );
        this.expectedAmount = expectedAmount;
        this.receivedAmount = receivedAmount;
    }
}

class ExpiredPrescriptionError extends DomainError {
    constructor(prescriptionId, expiryDate) {
        super(
            `Prescription ${prescriptionId} expired on ${expiryDate.toDateString()}`
        );
        this.prescriptionId = prescriptionId;
        this.expiryDate = expiryDate;
    }
}

class RefillLimitExceededError extends DomainError {
    constructor(prescriptionId, maxRefills) {
        super(
            `Refill limit exceeded for prescription ${prescriptionId}. Maximum: ${maxRefills}`
        );
        this.prescriptionId = prescriptionId;
        this.maxRefills = maxRefills;
    }
}

module.exports = {
    DomainError,
    InsufficientStockError,
    ExpiredBatchError,
    InvalidStateTransitionError,
    CurrencyMismatchError,
    PaymentMismatchError,
    ExpiredPrescriptionError,
    RefillLimitExceededError
};
