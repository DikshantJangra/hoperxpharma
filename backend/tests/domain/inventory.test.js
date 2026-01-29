/**
 * Domain Tests - Inventory Entities
 */

const Drug = require('../../src/domain/inventory/Drug');
const { StockMovement, MovementType } = require('../../src/domain/inventory/StockMovement');
const { Quantity, Unit } = require('../../src/domain/shared/valueObjects/Quantity');

describe('Drug Entity', () => {
    test('should create drug with valid data', () => {
        const drug = new Drug({
            id: '1',
            storeId: 'store1',
            name: 'Paracetamol',
            genericName: 'Acetaminophen',
            strength: '500mg',
            form: 'TABLET',
            manufacturer: 'PharmaCo',
            gstRate: 12,
            schedule: 'OTC'
        });

        expect(drug.name).toBe('Paracetamol');
        expect(drug.getFullName()).toBe('Paracetamol 500mg');
    });

    test('should identify controlled substances', () => {
        const controlled = new Drug({
            name: 'Alprazolam',
            schedule: 'H'
        });

        const otc = new Drug({
            name: 'Paracetamol',
            schedule: 'OTC'
        });

        expect(controlled.isControlledSubstance()).toBe(true);
        expect(otc.isControlledSubstance()).toBe(false);
    });

    test('should validate prescription requirement', () => {
        const prescriptionRequired = new Drug({
            name: 'Antibiotic',
            requiresPrescription: true,
            schedule: 'OTC'
        });

        const controlled = new Drug({
            name: 'Alprazolam',
            schedule: 'H',
            requiresPrescription: false
        });

        expect(prescriptionRequired.needsPrescription()).toBe(true);
        expect(controlled.needsPrescription()).toBe(true); // Controlled always needs Rx
    });

    test('should detect similar drugs', () => {
        const drug1 = new Drug({
            name: 'Crocin',
            genericName: 'Paracetamol',
            strength: '500mg',
            form: 'TABLET'
        });

        const drug2 = new Drug({
            name: 'Dolo',
            genericName: 'Paracetamol',
            strength: '500mg',
            form: 'TABLET'
        });

        const drug3 = new Drug({
            name: 'Dolo',
            genericName: 'Paracetamol',
            strength: '650mg', // Different strength
            form: 'TABLET'
        });

        expect(drug1.isSimilarTo(drug2)).toBe(true);
        expect(drug1.isSimilarTo(drug3)).toBe(false);
    });

    test('should validate drug data', () => {
        const invalidDrug = new Drug({
            name: '',
            form: null,
            gstRate: 50 // Invalid
        });

        expect(() => invalidDrug.validate()).toThrow('Drug validation failed');
    });

    test('should deactivate and reactivate', () => {
        const drug = new Drug({
            name: 'Test Drug',
            form: 'TABLET',
            isActive: true
        });

        drug.deactivate();
        expect(drug.isActive).toBe(false);

        drug.reactivate();
        expect(drug.isActive).toBe(true);
    });
});

describe('StockMovement Entity', () => {
    test('should create movement for GRN', () => {
        const movement = StockMovement.createForGRN(
            'batch1',
            new Quantity(100, Unit.TABLET),
            'GRN-202601-0001',
            'user1'
        );

        expect(movement.movementType).toBe(MovementType.IN);
        expect(movement.isIncoming()).toBe(true);
        expect(movement.getSignedQuantity()).toBe(100);
    });

    test('should create movement for sale', () => {
        const movement = StockMovement.createForSale(
            'batch1',
            new Quantity(10, Unit.TABLET),
            'INV-202601-0001',
            'user1'
        );

        expect(movement.movementType).toBe(MovementType.OUT);
        expect(movement.isOutgoing()).toBe(true);
        expect(movement.getSignedQuantity()).toBe(-10);
    });

    test('should create adjustment movement', () => {
        const positiveAdj = StockMovement.createAdjustment(
            'batch1',
            new Quantity(5, Unit.TABLET),
            'Found extra stock',
            'user1'
        );

        const negativeAdj = StockMovement.createAdjustment(
            'batch1',
            new Quantity(-3, Unit.TABLET),
            'Damaged items',
            'user1'
        );

        expect(positiveAdj.movementType).toBe(MovementType.IN);
        expect(negativeAdj.movementType).toBe(MovementType.OUT);
    });

    test('should set and track balances', () => {
        const movement = StockMovement.createForSale(
            'batch1',
            new Quantity(10, Unit.TABLET),
            'INV-001',
            'user1'
        );

        movement.setBalances(100, 90);

        expect(movement.balanceBefore).toBe(100);
        expect(movement.balanceAfter).toBe(90);
    });

    test('should validate movement data', () => {
        const invalidMovement = new StockMovement({
            batchId: null, // Invalid
            movementType: MovementType.IN,
            quantity: 10
        });

        expect(() => invalidMovement.validate()).toThrow('Batch ID is required');
    });
});

describe('Inventory Domain Service', () => {
    // Integration tests would go here
    // These would test allocation strategies, multi-batch operations, etc.
    // Requires mock repository

    test.todo('should allocate stock using FEFO strategy');
    test.todo('should allocate stock using FIFO strategy');
    test.todo('should handle insufficient stock gracefully');
    test.todo('should identify expiring batches');
});
