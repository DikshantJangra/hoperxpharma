/**
 * Property Test: Image Deduplication
 * 
 * Property 25: For any two identical images (same content hash) uploaded for different medicines,
 * only one copy SHALL be stored in object storage.
 * 
 * Validates: Requirements 7.3
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { imageContributionService } from '../../src/services/ImageContributionService';
import crypto from 'crypto';

describe('Property 25: Image Deduplication', () => {
  const testImage = Buffer.from('fake-image-data-for-testing');
  const contentHash = crypto.createHash('sha256').update(testImage).digest('hex');

  it('should detect duplicate images by content hash', async () => {
    // Property: Uploading the same image twice should return isDuplicate=true on second upload
    
    const input1 = {
      canonicalId: 'test-medicine-1',
      storeId: 'store-1',
      imageType: 'FRONT' as const,
      file: testImage,
      mimeType: 'image/jpeg',
    };

    const input2 = {
      canonicalId: 'test-medicine-2', // Different medicine
      storeId: 'store-2', // Different store
      imageType: 'BACK' as const, // Different type
      file: testImage, // Same image content
      mimeType: 'image/jpeg',
    };

    // First upload
    const result1 = await imageContributionService.uploadImage(input1);
    expect(result1.isDuplicate).toBe(false);
    expect(result1.contentHash).toBe(contentHash);

    // Second upload with same content
    const result2 = await imageContributionService.uploadImage(input2);
    
    // Property validation: Second upload should be detected as duplicate
    expect(result2.isDuplicate).toBe(true);
    expect(result2.contentHash).toBe(contentHash);
    expect(result2.existingImageId).toBe(result1.imageId);
  });

  it('should find duplicate by hash', async () => {
    // Property: findDuplicateByHash should return existing image with same hash
    
    const existing = await imageContributionService.findDuplicateByHash(contentHash);
    
    expect(existing).not.toBeNull();
    expect(existing?.contentHash).toBe(contentHash);
  });

  it('should not flag different images as duplicates', async () => {
    // Property: Different image content should have different hashes
    
    const differentImage = Buffer.from('completely-different-image-data');
    const differentHash = crypto.createHash('sha256').update(differentImage).digest('hex');

    expect(differentHash).not.toBe(contentHash);

    const input = {
      canonicalId: 'test-medicine-3',
      storeId: 'store-3',
      imageType: 'FRONT' as const,
      file: differentImage,
      mimeType: 'image/jpeg',
    };

    const result = await imageContributionService.uploadImage(input);
    
    // Property validation: Different content should not be flagged as duplicate
    expect(result.isDuplicate).toBe(false);
    expect(result.contentHash).toBe(differentHash);
    expect(result.contentHash).not.toBe(contentHash);
  });

  it('should calculate consistent hashes for same content', async () => {
    // Property: Hash function should be deterministic
    
    const hash1 = crypto.createHash('sha256').update(testImage).digest('hex');
    const hash2 = crypto.createHash('sha256').update(testImage).digest('hex');
    
    expect(hash1).toBe(hash2);
    expect(hash1).toBe(contentHash);
  });
});
