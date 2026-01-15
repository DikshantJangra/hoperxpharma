/**
 * Property Test: Input Validation Rejection (Property 35)
 * 
 * Validates: Requirements 9.7
 * 
 * Property: Invalid input should be rejected with 400 status and descriptive errors
 * 
 * Test Strategy:
 * - Submit invalid data
 * - Verify 400 response
 * - Verify error messages are descriptive
 */

import { describe, it, expect } from '@jest/globals';
import { 
  validateCreateMedicine, 
  validateUpdateMedicine, 
  validateStoreOverlay,
  validateIngestion 
} from '../../src/middlewares/validateMedicine';

describe('Property 35: Input Validation Rejection', () => {
  // Mock request, response, next
  const createMockReq = (body: any) => ({ body });
  const createMockRes = () => ({});
  const createMockNext = () => {
    const errors: any[] = [];
    return (error?: any) => {
      if (error) errors.push(error);
    };
  };

  describe('Create Medicine Validation', () => {
    it('should reject missing required fields', () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = jest.fn();

      validateCreateMedicine(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('name');
    });

    it('should reject invalid name (too short)', () => {
      const req = createMockReq({
        name: 'AB', // Too short
        compositionText: 'Valid composition',
        manufacturerName: 'Valid manufacturer',
        form: 'Tablet',
        packSize: '10 tablets',
        requiresPrescription: false,
        defaultGstRate: 12,
      });
      const res = createMockRes();
      const next = jest.fn();

      validateCreateMedicine(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('name must be at least 3 characters');
    });

    it('should reject invalid GST rate', () => {
      const req = createMockReq({
        name: 'Valid Name',
        compositionText: 'Valid composition',
        manufacturerName: 'Valid manufacturer',
        form: 'Tablet',
        packSize: '10 tablets',
        requiresPrescription: false,
        defaultGstRate: 50, // Invalid (> 28)
      });
      const res = createMockRes();
      const next = jest.fn();

      validateCreateMedicine(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('defaultGstRate');
    });

    it('should reject invalid requiresPrescription type', () => {
      const req = createMockReq({
        name: 'Valid Name',
        compositionText: 'Valid composition',
        manufacturerName: 'Valid manufacturer',
        form: 'Tablet',
        packSize: '10 tablets',
        requiresPrescription: 'yes', // Should be boolean
        defaultGstRate: 12,
      });
      const res = createMockRes();
      const next = jest.fn();

      validateCreateMedicine(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('requiresPrescription must be a boolean');
    });

    it('should accept valid input', () => {
      const req = createMockReq({
        name: 'Valid Medicine Name',
        compositionText: 'Valid composition',
        manufacturerName: 'Valid manufacturer',
        form: 'Tablet',
        packSize: '10 tablets',
        requiresPrescription: false,
        defaultGstRate: 12,
      });
      const res = createMockRes();
      const next = jest.fn();

      validateCreateMedicine(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(); // Called without error
    });
  });

  describe('Update Medicine Validation', () => {
    it('should accept partial updates', () => {
      const req = createMockReq({
        confidenceScore: 85,
      });
      const res = createMockRes();
      const next = jest.fn();

      validateUpdateMedicine(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid partial updates', () => {
      const req = createMockReq({
        confidenceScore: 150, // Invalid (> 100)
      });
      const res = createMockRes();
      const next = jest.fn();

      validateUpdateMedicine(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('confidenceScore');
    });
  });

  describe('Store Overlay Validation', () => {
    it('should reject negative stock quantity', () => {
      const req = createMockReq({
        stockQuantity: -10,
      });
      const res = createMockRes();
      const next = jest.fn();

      validateStoreOverlay(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('stockQuantity');
    });

    it('should reject invalid discount percentage', () => {
      const req = createMockReq({
        customDiscount: 150, // Invalid (> 100)
      });
      const res = createMockRes();
      const next = jest.fn();

      validateStoreOverlay(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('customDiscount');
    });

    it('should accept valid overlay data', () => {
      const req = createMockReq({
        customMrp: 150,
        customDiscount: 10,
        stockQuantity: 100,
        reorderLevel: 20,
      });
      const res = createMockRes();
      const next = jest.fn();

      validateStoreOverlay(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Ingestion Validation', () => {
    it('should reject missing source', () => {
      const req = createMockReq({
        name: 'Valid Name',
        compositionText: 'Valid composition',
        manufacturerName: 'Valid manufacturer',
        form: 'Tablet',
        packSize: '10 tablets',
        requiresPrescription: false,
        defaultGstRate: 12,
        // Missing source
      });
      const res = createMockRes();
      const next = jest.fn();

      validateIngestion(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('source');
    });

    it('should reject invalid source', () => {
      const req = createMockReq({
        name: 'Valid Name',
        compositionText: 'Valid composition',
        manufacturerName: 'Valid manufacturer',
        form: 'Tablet',
        packSize: '10 tablets',
        requiresPrescription: false,
        defaultGstRate: 12,
        source: 'INVALID_SOURCE',
      });
      const res = createMockRes();
      const next = jest.fn();

      validateIngestion(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('source must be one of');
    });

    it('should accept valid ingestion data', () => {
      const req = createMockReq({
        name: 'Valid Name',
        compositionText: 'Valid composition',
        manufacturerName: 'Valid manufacturer',
        form: 'Tablet',
        packSize: '10 tablets',
        requiresPrescription: false,
        defaultGstRate: 12,
        source: 'SCAN',
      });
      const res = createMockRes();
      const next = jest.fn();

      validateIngestion(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Error Message Quality', () => {
    it('should provide descriptive error messages', () => {
      const req = createMockReq({
        name: 'AB',
        compositionText: 'X',
        manufacturerName: 'M',
      });
      const res = createMockRes();
      const next = jest.fn();

      validateCreateMedicine(req as any, res as any, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toContain('Validation failed');
      expect(error.message.length).toBeGreaterThan(20); // Descriptive
    });

    it('should list multiple validation errors', () => {
      const req = createMockReq({
        name: 'AB', // Too short
        defaultGstRate: 50, // Invalid
      });
      const res = createMockRes();
      const next = jest.fn();

      validateCreateMedicine(req as any, res as any, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toContain('name');
      expect(error.message).toContain('defaultGstRate');
    });
  });
});
