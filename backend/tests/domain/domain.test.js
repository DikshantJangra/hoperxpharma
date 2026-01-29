/**
 * Unit Tests for Domain Value Objects and Batch Aggregate
 */

const Money = require('../../src/domain/shared/valueObjects/Money');
const { Quantity, Unit } = require('../../src/domain/shared/valueObjects/Quantity');
const BatchNumber = require('../../src/domain/inventory/valueObjects/BatchNumber');
const Batch = require('../../src/domain/inventory/Batch');
const {
    InsufficientStockError,
    ExpiredBatchError
} = require('../../src/domain/shared/errors/DomainErrors');

describe('Money Value Object', () => {
    test('should create money with valid amount', () => {
        const money = new Money(100.50);
        expect(money.getAmount()).toBe(100.50);
        expect(money.getCurrency()).toBe('INR');
    });

    test('should throw error for negative amount', () => {
        expect(() => new Money(-50)).toThrow('Money amount cannot be negative');
    });

    test('should add money correctly', () => {
        const m1 = new Money(100);
        const m2 = new Money(50);
        const result = m1.add(m2);
        expect(result.getAmount()).toBe(150);
    });

    test('should apply discount correctly', () => {
        const money = new Money(100);
        const discounted = money.applyDiscount(10); // 10% off
        expect(discounted.getAmount()).toBe(90);
    });

    test('should throw on currency mismatch', () => {
        const inr = new Money(100, 'INR');
        const usd = new Money(100, 'USD');
        expect(() => inr.add(usd)).toThrow('Currency mismatch');
    });
});

describe('Quantity Value Object', () => {
    test('should create quantity with valid value', () => {
        const qty = new Quantity(50, Unit.TABLET);
        expect(qty.getValue()).toBe(50);
        expect(qty.getUnit()).toBe(Unit.TABLET);
    });

    test('should throw error for negative quantity', () => {
        expect(() => new Quantity(-10)).toThrow('Quantity cannot be negative');
    });

    test('should add quantities of same unit', () => {
        const q1 = new Quantity(10, Unit.TABLET);
        const q2 = new Quantity(5, Unit.TABLET);
        const result = q1.add(q2);
        expect(result.getValue()).toBe(15);
    });

    test('should subtract quantities correctly', () => {
        const q1 = new Quantity(10, Unit.TABLET);
        const q2 = new Quantity(3, Unit.TABLET);
        const result = q1.subtract(q2);
        expect(result.getValue()).toBe(7);
    });

    test('should throw when subtracting more than available', () => {
        const q1 = new Quantity(5, Unit.TABLET);
        const q2 = new Quantity(10, Unit.TABLET);
        expect(() => q1.subtract(q2)).toThrow('negative quantity');
    });
});

describe('BatchNumber Value Object', () => {
    test('should normalize batch number to uppercase', () => {
        const batch = new BatchNumber('b001');
        expect(batch.getValue()).toBe('B001');
    });

    test('should throw for empty batch number', () => {
        expect(() => new BatchNumber('')).toThrow('Batch number cannot be empty');
    });
});

describe('Batch Aggregate', () => {
    test('should create batch with valid data', () => {
        const batch = new Batch({
            id: '1',
            batchNumber: 'B001',
            drugId: 'drug1',
            drugName: 'Paracetamol',
            quantity: 100,
            unit: Unit.TABLET,
            expiryDate: new Date('2025-12-31'),
            costPrice: 5,
            sellingPrice: 10,
            storeId: 'store1'
        });

        expect(batch.batchNumber.getValue()).toBe('B001');
        expect(batch.quantity.getValue()).toBe(100);
    });

    test('should deduct stock successfully', () => {
        const batch = new Batch({
            id: '1',
            batchNumber: 'B001',
            drugName: 'Paracetamol',
            quantity: 100,
            expiryDate: new Date('2025-12-31'),
            costPrice: 5,
            sellingPrice: 10
        });

        const qtyToDeduct = new Quantity(10, Unit.TABLET);
        batch.deduct(qtyToDeduct, 'Sale', 'user1');
        expect(batch.quantity.getValue()).toBe(90);
    });

    test('should throw InsufficientStockError when stock is low', () => {
        const batch = new Batch({
            id: '1',
            batchNumber: 'B001',
            drugName: 'Paracetamol',
            quantity: 5,
            expiryDate: new Date('2025-12-31'),
            costPrice: 5,
            sellingPrice: 10
        });

        const qtyToDeduct = new Quantity(10, Unit.TABLET);
        expect(() => {
            batch.deduct(qtyToDeduct, 'Sale', 'user1');
        }).toThrow(InsufficientStockError);
    });

    test('should throw ExpiredBatchError for expired batch', () => {
        const batch = new Batch({
            id: '1',
            batchNumber: 'B001',
            drugName: 'Paracetamol',
            quantity: 100,
            expiryDate: new Date('2020-01-01'), // Expired
            costPrice: 5,
            sellingPrice: 10
        });

        const qtyToDeduct = new Quantity(10, Unit.TABLET);
        expect(() => {
            batch.deduct(qtyToDeduct, 'Sale', 'user1');
        }).toThrow(ExpiredBatchError);
    });

    test('should detect expiring soon batches', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60); // 60 days ahead

        const batch = new Batch({
            id: '1',
            batchNumber: 'B001',
            quantity: 100,
            expiryDate: futureDate,
            costPrice: 5,
            sellingPrice: 10
        });

        expect(batch.isExpiringSoon(90)).toBe(true);
        expect(batch.isExpiringSoon(30)).toBe(false);
    });

    test('should calculate margin correctly', () => {
        const batch = new Batch({
            id: '1',
            batchNumber: 'B001',
            quantity: 100,
            expiryDate: new Date('2025-12-31'),
            costPrice: 50,
            sellingPrice: 100
        });

        const margin = batch.calculateMargin();
        expect(margin.getAmount()).toBe(50);
        expect(batch.calculateMarginPercentage()).toBe(100);
    });

    test('should emit domain events on stock deduction', () => {
        const batch = new Batch({
            id: '1',
            batchNumber: 'B001',
            drugName: 'Paracetamol',
            quantity: 100,
            expiryDate: new Date('2025-12-31'),
            costPrice: 5,
            sellingPrice: 10
        });

        const qtyToDeduct = new Quantity(10, Unit.TABLET);
        batch.deduct(qtyToDeduct, 'Sale', 'user1');

        const events = batch.getDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0].type).toBe('STOCK_DEDUCTED');
        expect(events[0].quantity.getValue()).toBe(10);
    });
});
