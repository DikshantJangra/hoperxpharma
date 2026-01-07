const axios = require('axios');
const logger = require('../config/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../db/prisma');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generates a system instruction based on the application's context.
 * This summarizes the database schema and key functionalities.
 */
const getSystemInstruction = () => {
    return `
You are an intelligent assistant for HopeRx Pharma, a pharmacy management system.
Your goal is to assist users (pharmacists, admins) by answering questions about the system's data and functionality.

Here is a summary of the database schema and key concepts:

**Core Infrastructure:**
- **Users:** Have roles (ADMIN, PHARMACIST, TECHNICIAN, CASHIER).
- **Stores:** Physical pharmacy locations with operating hours, licenses, and devices.
- **Roles & Permissions:** RBAC system managing access.

**Patient & Clinical:**
- **Patients:** Have profiles, medical history (allergies, chronic conditions), and insurance.
- **Prescriptions:** Linked to patients and prescribers. Statuses: DRAFT, IN_PROGRESS, COMPLETED, etc.
- **Dispensing:** Tracks the workflow (Intake -> Verify -> Fill -> Check -> Release).

**Inventory:**
- **Drugs:** Catalog of medicines (name, generic name, manufacturer, strength).
- **InventoryBatches:** Specific batches of drugs in a store with expiry dates and stock levels.
- **StockMovements:** Tracks inventory changes (IN, OUT, ADJUSTMENT).

**Operations:**
- **Sales:** Transactions linked to patients and items.
- **Purchase Orders (POs):** Orders to suppliers. Statuses: DRAFT, SENT, RECEIVED, etc.
- **Supplier Returns:** Returning damaged/expired goods.

**Guidelines:**
- Be concise and helpful.
- If asked about specific data (e.g., "How much Paracetamol is in stock?"), explain how to find it or ask for more context if needed (e.g., "Which store?").
- You are strictly a pharmacy assistant. Do not answer questions unrelated to pharmacy operations or the system.
- If you don't know the answer, say so.
`;
};

const chatWithGemini = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
        const systemInstruction = getSystemInstruction();

        // Construct the payload for Gemini
        // We include the system instruction as the first part of the conversation or context
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction + "\n\nUser Query: " + prompt }]
                }
            ]
        };

        const response = await axios.post(GEMINI_API_URL, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            logger.warn('Gemini API returned empty response', { response: response.data });
            return "I'm sorry, I couldn't generate a response at this time.";
        }

        return generatedText;
    } catch (error) {
        logger.error('Error communicating with Gemini API:', error.response?.data || error.message);
        throw new Error('Failed to get response from AI service');
    }
};

module.exports = {
    chatWithGemini
};
