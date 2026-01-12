import { createWorker } from 'tesseract.js';
import { RegexMatcher, ExtractedComponent } from './regex-matcher';

export interface OCRResult {
    rawText: string;
    extractedSalts: ExtractedComponent[];
    confidence: number;
}

export class SaltOCRService {
    /**
     * Process an image (File/Blob/URL) and extract salt information
     * @param imageSource The image to process
     */
    static async processImage(imageSource: string | File | Blob): Promise<OCRResult> {
        const worker = await createWorker('eng');

        try {
            const ret = await worker.recognize(imageSource);
            const text = ret.data.text;
            const confidence = ret.data.confidence;

            // Extract salts using RegexMatcher
            // We split lines and try to find composition lines
            const lines = text.split('\n').filter(line => line.trim().length > 5);

            let allExtracted: ExtractedComponent[] = [];

            // Pattern to identify composition lines
            const compositionKeywords = [/composition/i, /contains/i, /each.+tablet/i, /ip/i, /bp/i, /usp/i];

            lines.forEach(line => {
                // If line likely contains salt info (or just try all lines for now)
                const isRelevant = compositionKeywords.some(kw => kw.test(line));

                if (isRelevant || lines.length < 10) { // If few lines, check all. If many, filter.
                    const components = RegexMatcher.parseComposition(line);
                    // Filter out low confidence noise
                    const validComponents = components.filter(c => c.confidence !== 'LOW' && c.name.length > 3);
                    allExtracted = [...allExtracted, ...validComponents];
                }
            });

            // Deduplicate by name
            const uniqueSalts = Array.from(new Map(allExtracted.map(item => [item.name, item])).values());

            await worker.terminate();

            return {
                rawText: text,
                extractedSalts: uniqueSalts,
                confidence
            };

        } catch (error) {
            await worker.terminate();
            console.error("OCR Failed:", error);
            throw error;
        }
    }
}
