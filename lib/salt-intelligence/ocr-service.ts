/**
 * Enhanced OCR Service for Salt Composition Extraction
 * 
 * Uses backend Gemini Vision API for accurate text extraction.
 * Validates: Requirements 1.3, 2.1, 2.2, 8.1
 */

import { RegexMatcher, ExtractedComponent } from './regex-matcher';

export interface OCRConfig {
  language?: string;
}

export interface OCRResult {
  rawText: string;
  extractedSalts: ExtractedComponent[];
  confidence: number;
  processingTime: number;
  error?: string;
  medicineName?: string | null;
  manufacturer?: string | null;
  form?: string | null;
  composition?: string | null;
}

export interface ImageValidation {
  valid: boolean;
  errors: string[];
}

export class SaltOCRService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MIN_WIDTH = 300; // Very lenient
  private static readonly MIN_HEIGHT = 300; // Very lenient

  /**
   * Validate image before processing
   * @param imageSource - Image file or blob
   * @returns Validation result
   */
  static async validateImage(imageSource: File | Blob): Promise<ImageValidation> {
    const errors: string[] = [];

    // Check file size
    if (imageSource.size > this.MAX_FILE_SIZE) {
      errors.push(`Image size (${(imageSource.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 10MB`);
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageSource.type)) {
      errors.push(`Invalid image format. Supported formats: JPG, PNG, WEBP`);
    }

    // Check dimensions (if possible) - very lenient now
    try {
      const dimensions = await this.getImageDimensions(imageSource);
      
      // Very lenient check - just ensure it's not tiny
      if (dimensions.width < this.MIN_WIDTH || dimensions.height < this.MIN_HEIGHT) {
        errors.push(`Image resolution (${dimensions.width}x${dimensions.height}) is too low. Minimum: ${this.MIN_WIDTH}x${this.MIN_HEIGHT}`);
      }
    } catch (error) {
      // Dimension check failed, but continue
      console.warn('Could not validate image dimensions:', error);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get image dimensions
   * @private
   */
  private static getImageDimensions(imageSource: File | Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageSource);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Process image and extract salt composition using backend Gemini API
   * @param imageSource - Image file or blob
   * @param config - OCR configuration (unused, kept for compatibility)
   * @returns OCR result with extracted salts
   */
  static async processImage(
    imageSource: File | Blob,
    _config: OCRConfig = {}
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      console.log('[OCR] Starting image processing with Gemini API...');
      
      // Validate image
      console.log('[OCR] Validating image...');
      const validation = await this.validateImage(imageSource);
      if (!validation.valid) {
        console.error('[OCR] Validation failed:', validation.errors);
        return {
          rawText: '',
          extractedSalts: [],
          confidence: 0,
          processingTime: Date.now() - startTime,
          error: validation.errors.join('; '),
          medicineName: null,
          manufacturer: null,
          form: null,
          composition: null,
        };
      }
      console.log('[OCR] Image validation passed');

      // Convert image to base64
      console.log('[OCR] Converting image to base64...');
      const base64Image = await this.imageToBase64(imageSource);
      console.log('[OCR] Conversion complete, calling backend API...');

      // Call backend OCR API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/v1/ocr/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: imageSource.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR API request failed');
      }

      const result = await response.json();
      console.log('[OCR] Backend response:', result);

      const processingTime = Date.now() - startTime;

      // If backend returned an error
      if (result.error) {
        console.warn('[OCR] Backend returned error:', result.error);
        return {
          rawText: '',
          extractedSalts: [],
          confidence: 0,
          processingTime,
          error: result.error,
          medicineName: null,
          manufacturer: null,
          form: null,
          composition: null,
        };
      }

      // Parse composition from extracted text (use composition field if available, otherwise rawText)
      const textToParse = result.composition || result.text || '';
      const extractedSalts = RegexMatcher.parseComposition(textToParse);
      console.log('[OCR] Extracted salts:', extractedSalts);

      return {
        rawText: result.text || '',
        extractedSalts,
        confidence: result.confidence || 0,
        processingTime,
        medicineName: result.medicineName || null,
        manufacturer: result.manufacturer || null,
        form: result.form || null,
        composition: result.composition || null,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[OCR] Processing error:', error);
      
      return {
        rawText: '',
        extractedSalts: [],
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : 'OCR processing failed',
        medicineName: null,
        manufacturer: null,
        form: null,
        composition: null,
      };
    }
  }

  /**
   * Convert image to base64 string (without data URL prefix)
   * @private
   */
  private static imageToBase64(imageSource: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(imageSource);
    });
  }

  /**
   * Get processing statistics
   */
  static getStats(): { service: string; model: string } {
    return {
      service: 'Gemini Vision API',
      model: 'gemini-2.5-flash (FREE)',
    };
  }
}
