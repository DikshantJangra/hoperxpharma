/**
 * BatchNumber Value Object
 * Encapsulates batch number with validation
 */

class BatchNumber {
    constructor(value) {
        if (!value || typeof value !== 'string') {
            throw new Error('Batch number must be a non-empty string');
        }

        const trimmed = value.trim();
        if (trimmed.length === 0) {
            throw new Error('Batch number cannot be empty');
        }

        // Normalize: uppercase and trim
        this.value = trimmed.toUpperCase();
    }

    static fromPrisma(value) {
        return new BatchNumber(value);
    }

    getValue() {
        return this.value;
    }

    equals(other) {
        if (!other) return false;
        return this.value === other.value;
    }

    toString() {
        return this.value;
    }

    toJSON() {
        return this.value;
    }

    toPrisma() {
        return this.value;
    }
}

module.exports = BatchNumber;
