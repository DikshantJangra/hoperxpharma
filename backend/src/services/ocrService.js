/**
 * OCR Service using Google Gemini Vision API (FREE)
 * 
 * Extracts text from medicine strip images using Gemini 2.5 Flash
 * Free tier: 100% FREE - No limits on free tier for Flash models!
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

/**
 * Extract text from image using Gemini Vision API
 * @param {string} base64Image - Base64 encoded image data (without data:image prefix)
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function extractTextFromImage(base64Image, mimeType = 'image/jpeg') {
  try {
    console.log('[Gemini OCR] Starting text extraction...');
    console.log('[Gemini OCR] Image size:', base64Image.length, 'bytes');
    console.log('[Gemini OCR] MIME type:', mimeType);

    // Get the Gemini 2.5 Flash model (stable, free, perfect for OCR)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create the prompt for medicine composition extraction with comprehensive format understanding
    const prompt = `You are an expert OCR system specialized in reading Indian pharmaceutical packaging and medicine strips.

Extract ALL information from this medicine strip/package image in a structured format. Indian medicine strips can have various formats:

**COMPOSITION FORMATS YOU MIGHT SEE:**
- "Each tablet contains: Paracetamol IP 500mg"
- "Each film coated tablet contains: Ibuprofen BP 400mg"
- "Composition (w/w): Diclofenac Sodium 1% w/w"
- "Composition (w/v): Amoxicillin 250mg/5ml"
- "Each capsule contains: Omeprazole USP 20mg"
- "Contains: Paracetamol 500mg + Caffeine 65mg"
- "Active Ingredients: Cetirizine Hydrochloride IP 10mg"
- "Cholecalciferol (Vit D3) I.P. 6,00,000 I.U."

**STRENGTH UNITS YOU MIGHT SEE:**
- mg (milligrams) - most common
- mcg or µg (micrograms)
- g or gm (grams)
- IU or I.U. (International Units) - for vitamins like D3, A, E
- % w/w (weight by weight) - for creams/ointments
- % w/v (weight by volume) - for liquids
- mg/ml or mg/5ml - for syrups/suspensions

**PHARMACOPOEIA STANDARDS:**
- IP or I.P. (Indian Pharmacopoeia)
- BP or B.P. (British Pharmacopoeia)
- USP or U.S.P. (United States Pharmacopoeia)

**MEDICINE FORMS:**
- Tablet, Film Coated Tablet, Enteric Coated Tablet
- Capsule, Hard Gelatin Capsule, Soft Gelatin Capsule
- Syrup, Suspension, Oral Solution
- Injection, IV Infusion
- Cream, Ointment, Gel
- Drops (Eye Drops, Ear Drops, Nasal Drops)

**YOUR TASK:**
Extract and return information in this EXACT format:

MEDICINE_NAME: [brand name - usually prominent at top]
MANUFACTURER: [company name]
FORM: [type from list above]
COMPOSITION: [ingredient name] [strength][unit]

**COMPOSITION FORMATTING RULES:**
1. Write ONLY the active ingredient name followed by strength and unit
2. Remove "I.P.", "B.P.", "U.S.P." from the composition output
3. Convert Indian number format (6,00,000) to standard format (600000)
4. For IU units, write as: "Cholecalciferol 600000 IU" (NOT "6,00,000 I.U.")
5. Include alternate names in parentheses: "Cholecalciferol (Vit D3) 600000 IU"
6. For multiple ingredients, separate with comma: "Paracetamol 500mg, Caffeine 65mg"
7. Do NOT include "q.s.", "Oily base", or inactive ingredients

**EXAMPLES:**
MEDICINE_NAME: Avcal-D3
MANUFACTURER: Arvincare
FORM: Injection
COMPOSITION: Cholecalciferol (Vit D3) 600000 IU

MEDICINE_NAME: Crocin 500
MANUFACTURER: GlaxoSmithKline Pharmaceuticals Ltd
FORM: Tablet
COMPOSITION: Paracetamol 500mg

MEDICINE_NAME: Combiflam
MANUFACTURER: Sanofi India Limited
FORM: Film Coated Tablet
COMPOSITION: Ibuprofen 400mg, Paracetamol 325mg

MEDICINE_NAME: Amoxyclav 625
MANUFACTURER: Alkem Laboratories
FORM: Film Coated Tablet
COMPOSITION: Amoxicillin 500mg, Clavulanic Acid 125mg

**IMPORTANT RULES:**
1. Keep the EXACT format with colons and line breaks
2. DO NOT include pharmacopoeia standards (IP/BP/USP) in composition
3. Include ALL active ingredients with their strengths
4. Use commas to separate multiple ingredients
5. If any field is not clearly visible, write "NOT_FOUND"
6. If image is completely unreadable, respond with: "NO_TEXT_FOUND"

Extract the information now:`;

    // Prepare the image part
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    console.log('[Gemini OCR] Sending request to Gemini API...');
    const startTime = Date.now();

    // Generate content
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const processingTime = Date.now() - startTime;
    console.log('[Gemini OCR] Processing time:', processingTime, 'ms');
    console.log('[Gemini OCR] Extracted text length:', text.length);
    console.log('[Gemini OCR] Extracted text:', text);

    // Check if no text was found
    if (text.includes('NO_TEXT_FOUND') || text.trim().length === 0) {
      console.warn('[Gemini OCR] No text found in image');
      return {
        text: '',
        confidence: 0,
        processingTime,
        error: 'No readable text found in image. Please ensure the image is clear and well-lit.',
        medicineName: null,
        manufacturer: null,
        form: null,
        composition: null,
      };
    }

    // Parse structured data
    const parsed = parseStructuredOCR(text);

    // Calculate confidence based on response quality
    const confidence = calculateConfidence(text, parsed);

    console.log('[Gemini OCR] Extraction successful, confidence:', confidence);
    console.log('[Gemini OCR] Parsed data:', parsed);

    return {
      text: text.trim(),
      confidence,
      processingTime,
      ...parsed,
    };
  } catch (error) {
    console.error('[Gemini OCR] Error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('quota')) {
      return {
        text: '',
        confidence: 0,
        error: 'API quota exceeded. Please try again in a few minutes.',
      };
    }

    if (error.message?.includes('API key')) {
      return {
        text: '',
        confidence: 0,
        error: 'API configuration error. Please contact support.',
      };
    }

    return {
      text: '',
      confidence: 0,
      error: error.message || 'OCR processing failed. Please try again.',
    };
  }
}

/**
 * Parse structured OCR response
 * @param {string} text - OCR text with structured format
 * @returns {object} Parsed medicine data
 */
function parseStructuredOCR(text) {
  const lines = text.split('\n');
  const result = {
    medicineName: null,
    manufacturer: null,
    form: null,
    composition: null,
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('MEDICINE_NAME:')) {
      const value = trimmed.substring('MEDICINE_NAME:'.length).trim();
      if (value && value !== 'NOT_FOUND') {
        result.medicineName = value;
      }
    } else if (trimmed.startsWith('MANUFACTURER:')) {
      const value = trimmed.substring('MANUFACTURER:'.length).trim();
      if (value && value !== 'NOT_FOUND') {
        result.manufacturer = value;
      }
    } else if (trimmed.startsWith('FORM:')) {
      const value = trimmed.substring('FORM:'.length).trim();
      if (value && value !== 'NOT_FOUND') {
        result.form = value;
      }
    } else if (trimmed.startsWith('COMPOSITION:')) {
      const value = trimmed.substring('COMPOSITION:'.length).trim();
      if (value && value !== 'NOT_FOUND') {
        result.composition = value;
      }
    }
  }

  return result;
}

/**
 * Calculate confidence score based on extracted text quality
 * @param {string} text - Extracted text
 * @param {object} parsed - Parsed structured data
 * @returns {number} Confidence score (0-100)
 */
function calculateConfidence(text, parsed) {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  let confidence = 30; // Base confidence

  // Increase confidence for each field found
  if (parsed.medicineName) confidence += 20;
  if (parsed.manufacturer) confidence += 15;
  if (parsed.form) confidence += 10;
  if (parsed.composition) confidence += 25;

  // Cap at 95 (never 100% confident without manual verification)
  return Math.min(confidence, 95);
}

module.exports = {
  extractTextFromImage,
};
