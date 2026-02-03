/**
 * Integration Tests - Inventory Service
 * Tests service layer integration with domain models and repositories
 */

const inventoryService = require('../../src/services/inventory/inventoryService');
const Drug = require('../../src/domain/inventory/Drug');
const Batch = require('../../src/domain/inventory/Batch');
const { Quantity, Unit } = require('../../src/domain/shared/valueObjects/Quantity');

// Mock repository
jest.mock('../../src/repositories/inventoryRepository');
const inventoryRepository = require('../../src/repositories/inventoryRepository');

describe('Inventory Service Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Drug Management', () => {
        test('should create drug and return DTO', async () => {
            const drugData = {
                storeId: 'store1',
                name: 'Paracetamol',
                genericName: 'Acetaminophen',
                strength: '500mg',
                form: 'TABLET',
                gstRate: 12
            };

            const mockCreated = { ...drugData, id: 'drug-123', isActive: true };
            inventoryRepository.createDrug.mockResolvedValue(mockCreated);

            const result = await inventoryService.createDrug(drugData);

            expect(result).toHaveProperty('id');
            expect(result.fullName).toBe('Paracetamol 500mg');
            expect(result.isControlled).toBe(false);
            expect(inventoryRepository.createDrug).toHaveBeenCalled();
        });

        test('should reject invalid drug data', async () => {
            const invalidDrug = {
                storeId: 'store1',
                name: '',
                form: null,
                gstRate: 50 // Invalid
            };

            await expect(inventoryService.createDrug(invalidDrug))
                .rejects.toThrow('Drug validation failed');
        });
    });

    describe('Batch Management', () => {
        test('should create batch and emit events if expiring soon', async () => {
            const expiringDate = new Date();
            expiringDate.setDate(expiringDate.getDate() + 20); // 20 days

            const batchData = {
                storeId: 'store1',
                drugId: 'drug1',
                batchNumber: 'B001',
                quantity: 100,
                unit: Unit.TABLET,
                expiryDate: expiringDate,
                mrp: 10,
                purchasePrice: 5
            };

            const mockCreated = { ...batchData, id: 'batch-123' };
            inventoryRepository.createBatch.mockResolvedValue(mockCreated);

            const result = await inventoryService.createBatch(batchData, 'user1');

            expect(result).toHaveProperty('id');
            expect(result.isExpiringSoon).toBe(true);
        });

        test('should allocate stock using domain service', async () => {
            const mockBatches = [
                {
                    id: 'batch1',
                    batchNumber: 'B001',
                    drugId: 'drug1',
                    baseUnitQuantity: 100,
                    expiryDate: new Date('2025-12-31'),
                    mrp: 10,
                    purchasePrice: 5,
                    storeId: 'store1'
                },
                {
                    id: 'batch2',
                    batchNumber: 'B002',
                    drugId: 'drug1',
                    baseUnitQuantity: 50,
                    expiryDate: new Date('2025-06-30'), // Expires sooner
                    mrp: 10,
                    purchasePrice: 5,
                    storeId: 'store1'
                }
            ];

            inventoryRepository.findAvailableBatches = jest.fn().mockResolvedValue(mockBatches);

            const allocations = await inventoryService.allocateStock('store1', 'drug1', 120, 'FEFO');

            // FEFO should allocate from batch2 first (expires sooner)
            expect(allocations.length).toBeGreaterThan(0);
            expect(allocations[0].batch.batchNumber.getValue()).toBe('B002');
        });
    });

    describe('Stock Adjustment', () => {
        test('should adjust stock and create movement', async () => {
            const batchData = {
                id: 'batch1',
                batchNumber: 'B001',
                drugId: 'drug1',
                baseUnitQuantity: 100,
                expiryDate: new Date('2025-12-31'),
                mrp: 10,
                purchasePrice: 5,
                storeId: 'store1'
            };

            inventoryRepository.findBatchById.mockResolvedValue(batchData);
            inventoryRepository.updateBatchQuantity.mockResolvedValue({});
            inventoryRepository.createStockMovement.mockResolvedValue({});

            const result = await inventoryService.adjustStock({
                batchId: 'batch1',
                quantity: 10,
                reason: 'Found extra stock',
                userId: 'user1'
            }, 'user1');

            expect(result.quantity.getValue()).toBe(110);
            expect(inventoryRepository.createStockMovement).toHaveBeenCalled();
        });
    });
});
