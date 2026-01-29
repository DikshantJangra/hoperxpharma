/**
 * Domain Tests - Prescription Aggregate
 */

const { Prescription, PrescriptionStatus, PrescriptionType } = require('../../src/domain/prescription/Prescription');

describe('Prescription Aggregate - State Machine', () => {
    test('should create prescription in DRAFT status', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            doctorId: 'doctor1',
            createdBy: 'user1'
        });

        expect(prescription.status).toBe(PrescriptionStatus.DRAFT);
    });

    test('should transition from DRAFT to VERIFIED', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            createdBy: 'user1'
        });

        prescription.addItem({
            drugId: 'drug1',
            drugName: 'Amoxicillin',
            dosage: '500mg',
            frequency: 'TID',
            duration: '7 days',
            quantity: 21
        });

        prescription.verify('pharmacist1');

        expect(prescription.status).toBe(PrescriptionStatus.VERIFIED);
        expect(prescription.verifiedBy).toBe('pharmacist1');
        expect(prescription.verifiedAt).toBeDefined();
    });

    test('should not verify prescription without items', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1'
        });

        expect(() => prescription.verify('user1')).toThrow('Cannot verify prescription without items');
    });

    test('should transition from VERIFIED to ACTIVE', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.VERIFIED
        });

        prescription.activate();

        expect(prescription.status).toBe(PrescriptionStatus.ACTIVE);
        expect(prescription.expiryDate).toBeDefined(); // Auto-set if not provided
    });

    test('should handle partial dispensing', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.ACTIVE
        });

        prescription.markPartiallyDispensed();

        expect(prescription.status).toBe(PrescriptionStatus.PARTIALLY_DISPENSED);
    });

    test('should complete prescription', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.ACTIVE
        });

        prescription.complete();

        expect(prescription.status).toBe(PrescriptionStatus.COMPLETED);
    });

    test('should not allow invalid state transitions', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.DRAFT
        });

        // Cannot go directly from DRAFT to ACTIVE
        expect(() => {
            prescription.assertCanTransitionTo(PrescriptionStatus.ACTIVE);
        }).toThrow('Invalid state transition');
    });

    test('should not cancel completed prescription', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.COMPLETED
        });

        expect(() => prescription.cancel('Test', 'user1')).toThrow('Cannot cancel completed prescription');
    });
});

describe('Prescription - Business Logic', () => {
    test('should detect expired prescription', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            expiryDate: yesterday
        });

        expect(prescription.isExpired()).toBe(true);
    });

    test('should allow dispensing active non-expired prescription', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.ACTIVE,
            expiryDate: tomorrow
        });

        expect(prescription.canBeDispensed()).toBe(true);
    });

    test('should not allow dispensing expired prescription', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.ACTIVE,
            expiryDate: yesterday
        });

        expect(prescription.canBeDispensed()).toBe(false);
    });

    test('should manage refills', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            type: PrescriptionType.CHRONIC,
            refillsAllowed: 3,
            refillsRemaining: 3
        });

        expect(prescription.hasRefillsAvailable()).toBe(true);

        prescription.consumeRefill();
        expect(prescription.refillsRemaining).toBe(2);

        prescription.consumeRefill();
        prescription.consumeRefill();
        expect(prescription.refillsRemaining).toBe(0);
        expect(prescription.hasRefillsAvailable()).toBe(false);
    });

    test('should not allow refill consumption when none remaining', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            refillsAllowed: 0,
            refillsRemaining: 0
        });

        expect(() => prescription.consumeRefill()).toThrow('No refills remaining');
    });

    test('should only allow adding items to DRAFT', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.ACTIVE
        });

        expect(() => {
            prescription.addItem({
                drugId: 'drug1',
                drugName: 'Test',
                dosage: '500mg'
            });
        }).toThrow('Can only add items to DRAFT prescriptions');
    });
});

describe('Prescription - Domain Events', () => {
    test('should raise events on state changes', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1'
        });

        prescription.addItem({
            drugId: 'drug1',
            drugName: 'Test',
            quantity: 10
        });

        prescription.verify('user1');
        const events = prescription.getDomainEvents();

        expect(events.length).toBe(1);
        expect(events[0].type).toBe('PRESCRIPTION_VERIFIED');
    });

    test('should clear events after retrieval', () => {
        const prescription = new Prescription({
            storeId: 'store1',
            patientId: 'patient1',
            status: PrescriptionStatus.VERIFIED
        });

        prescription.activate();
        const events = prescription.clearEvents();

        expect(events.length).toBe(1);
        expect(prescription.getDomainEvents().length).toBe(0);
    });
});
