/**
 * Quantity Value Object
 * Encapsulates quantity with unit, providing unit conversion and validation
 */

const Unit = {
    TABLET: 'TABLET',
    CAPSULE: 'CAPSULE',
    STRIP: 'STRIP',
    BOX: 'BOX',
    BOTTLE: 'BOTTLE',
    VIAL: 'VIAL',
    ML: 'ML',
    GM: 'GM',
    UNIT: 'UNIT'
};

class Quantity {
    constructor(value, unit = Unit.TABLET) {
        if (value < 0) {
            throw new Error('Quantity cannot be negative');
        }

        if (!Object.values(Unit).includes(unit)) {
            throw new Error(`Invalid unit: ${unit}`);
        }

        this.value = parseFloat(value);
        this.unit = unit;
    }

    static zero(unit = Unit.TABLET) {
        return new Quantity(0, unit);
    }

    static fromPrisma(value, unit = Unit.TABLET) {
        return new Quantity(value, unit);
    }

    getValue() {
        return this.value;
    }

    getUnit() {
        return this.unit;
    }

    add(other) {
        // For now, require same units. In future, implement conversion
        if (this.unit !== other.unit) {
            throw new Error(`Cannot add quantities with different units: ${this.unit} and ${other.unit}`);
        }
        return new Quantity(this.value + other.value, this.unit);
    }

    subtract(other) {
        if (this.unit !== other.unit) {
            throw new Error(`Cannot subtract quantities with different units: ${this.unit} and ${other.unit}`);
        }

        const result = this.value - other.value;
        if (result < 0) {
            throw new Error('Subtraction would result in negative quantity');
        }

        return new Quantity(result, this.unit);
    }

    multiply(factor) {
        if (factor < 0) {
            throw new Error('Cannot multiply quantity by negative factor');
        }
        return new Quantity(this.value * factor, this.unit);
    }

    divide(divisor) {
        if (divisor <= 0) {
            throw new Error('Cannot divide quantity by zero or negative number');
        }
        return new Quantity(this.value / divisor, this.unit);
    }

    negate() {
        return new Quantity(-this.value, this.unit);
    }

    equals(other) {
        if (!other) return false;
        return this.unit === other.unit && this.value === other.value;
    }

    isGreaterThan(other) {
        this.ensureSameUnit(other);
        return this.value > other.value;
    }

    isGreaterThanOrEqual(other) {
        this.ensureSameUnit(other);
        return this.value >= other.value;
    }

    isLessThan(other) {
        this.ensureSameUnit(other);
        return this.value < other.value;
    }

    isZero() {
        return this.value === 0;
    }

    ensureSameUnit(other) {
        if (this.unit !== other.unit) {
            throw new Error(`Unit mismatch: ${this.unit} vs ${other.unit}`);
        }
    }

    // Serialization
    toJSON() {
        return {
            value: this.value,
            unit: this.unit
        };
    }

    toPrisma() {
        return {
            value: this.value,
            unit: this.unit
        };
    }

    toString() {
        return `${this.value} ${this.unit}`;
    }
}

module.exports = { Quantity, Unit };
