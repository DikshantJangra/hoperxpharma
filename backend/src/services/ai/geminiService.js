const conversationStore = require('../../utils/conversationStore');
const { toolDeclarations, toolHandlers } = require('./geminiTools');
const logger = require('../../config/logger');

/**
 * Gemini AI Service for HopeRx Pharmacy
 * Provides context-aware pharmacy operations assistance
 */
class GeminiService {
    constructor() {
        this.apiKey = process.env.API_KEY;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        if (!this.apiKey) {
            throw new Error('API_KEY environment variable is required for Gemini service');
        }
    }

    /**
     * Generate system instruction based on user context
     */
    generateSystemInstruction(context = {}) {
        const { userRole, storeName, currentPage } = context;

        return `You are the HopeRx AI Assistant, an expert in pharmacy operations, inventory management, and clinical safety.

IDENTITY:
- You assist with pharmacy MANAGEMENT tasks only (stock, billing, procurement, compliance)
- You do NOT provide medical diagnosis or treatment advice
- You are concise, clinical, and efficient - pharmacists are busy professionals

FORMATTING RULES (CRITICAL):
- Always format money in ₹ (INR) with proper formatting (e.g., ₹1,234.50)
- Always format dates in DD/MM/YYYY format
- When listing drugs, include: Name, Dosage/Strength, Form, Batch Number (if applicable), Expiry Date
- Use bullet points and tables for better readability
- Keep responses concise but complete

CURRENT CONTEXT:
${userRole ? `- User Role: ${userRole}` : ''}
${storeName ? `- Store: ${storeName}` : ''}
${currentPage ? `- Current Page: ${currentPage}` : ''}

CAPABILITIES:
You have access to the following tools to help users:
1. check_inventory - Check stock levels and batch details for any drug
2. get_drug_info - Get detailed drug information (generic name, manufacturer, HSN, GST)
3. create_draft_po - Create draft purchase orders
4. get_sales_trends - Analyze sales data and trends
5. search_suppliers - Find suppliers with contact and performance info
6. get_low_stock_alerts - Get list of drugs running low on stock

ROLE-BASED BEHAVIOR:
${userRole === 'ADMIN' ? '- As an ADMIN user, you can provide business insights, P&L summaries, and create purchase orders' : ''}
${userRole === 'PHARMACIST' ? '- As a PHARMACIST user, focus on clinical operations, pending prescriptions, and stock alerts' : ''}
${userRole === 'TECHNICIAN' ? '- As a TECHNICIAN user, focus on inventory checks and basic queries. You cannot create purchase orders.' : ''}
${userRole === 'CASHIER' ? '- As a CASHIER user, focus on sales and billing queries. You cannot access inventory management.' : ''}

BOUNDARIES:
- If asked for medical advice, diagnosis, or treatment recommendations, respond: "I can only assist with pharmacy operations and management. Please consult a qualified healthcare professional for medical advice."
- If asked to perform an action beyond your role permissions, politely explain the limitation
- Always prioritize patient safety and regulatory compliance

RESPONSE STYLE:
- Be professional but friendly
- Use pharmacy terminology appropriately
- Provide actionable insights
- When suggesting actions, be specific (e.g., "Create a PO for 100 units of Paracetamol 500mg from Supplier XYZ")
- If you need more information, ask specific questions`;
    }

    /**
     * Build context string from user context
     */
    buildContextString(context = {}) {
        const { userRole, storeId, storeName, currentPage, userName } = context;

        let contextParts = [];

        if (userName) contextParts.push(`User: ${userName}`);
        if (userRole) contextParts.push(`Role: ${userRole}`);
        if (storeName) contextParts.push(`Store: ${storeName}`);
        if (currentPage) contextParts.push(`Current Page: ${currentPage}`);

        return contextParts.length > 0
            ? `[Context: ${contextParts.join(' | ')}]\n\n`
            : '';
    }

    /**
     * Send chat message to Gemini
     */
    async chat(sessionId, userMessage, context = {}) {
        try {
            // Update session context
            conversationStore.updateContext(sessionId, context);

            // Get conversation history
            const history = conversationStore.getHistory(sessionId);

            // Build the request
            const systemInstruction = this.generateSystemInstruction(context);
            const contextString = this.buildContextString(context);
            const fullMessage = contextString + userMessage;

            // Add user message to history
            conversationStore.addMessage(sessionId, 'user', fullMessage);

            // Prepare API request
            const requestBody = {
                systemInstruction: {
                    parts: [{ text: systemInstruction }],
                },
                contents: [
                    ...history,
                    {
                        role: 'user',
                        parts: [{ text: fullMessage }],
                    },
                ],
                tools: [
                    {
                        functionDeclarations: toolDeclarations,
                    },
                ],
            };

            logger.info(`[Gemini] Sending chat request for session ${sessionId}`);

            // Call Gemini API
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Check if Gemini wants to call a function
            const candidate = data.candidates?.[0];
            const content = candidate?.content;

            if (!content) {
                throw new Error('No content in Gemini response');
            }

            // Check for function calls
            const functionCalls = content.parts?.filter(part => part.functionCall);

            if (functionCalls && functionCalls.length > 0) {
                // Handle function calls
                const functionResults = await this.handleFunctionCalls(functionCalls, context);

                // Send function results back to Gemini
                const finalResponse = await this.sendFunctionResults(
                    sessionId,
                    systemInstruction,
                    history,
                    fullMessage,
                    functionCalls,
                    functionResults
                );

                return finalResponse;
            }

            // No function calls, just return the text response
            const textPart = content.parts?.find(part => part.text);
            const responseText = textPart?.text || 'I apologize, but I could not generate a response.';

            // Add assistant response to history
            conversationStore.addMessage(sessionId, 'model', responseText);

            return {
                success: true,
                message: responseText,
                functionCalls: [],
            };

        } catch (error) {
            logger.error(`[Gemini] Chat error: ${error.message}`, { sessionId, error });

            return {
                success: false,
                message: 'I encountered an error processing your request. Please try again.',
                error: error.message,
            };
        }
    }

    /**
     * Handle function calls from Gemini
     */
    async handleFunctionCalls(functionCalls, context) {
        const results = [];

        for (const call of functionCalls) {
            const functionName = call.functionCall.name;
            const args = call.functionCall.args || {};

            logger.info(`[Gemini] Executing function: ${functionName}`, { args });

            // Inject storeId from context if not provided
            if (!args.storeId && context.storeId) {
                args.storeId = context.storeId;
            }

            // Get the handler
            const handler = toolHandlers[functionName];

            if (!handler) {
                results.push({
                    name: functionName,
                    response: {
                        success: false,
                        message: `Unknown function: ${functionName}`,
                    },
                });
                continue;
            }

            // Execute the handler
            try {
                const result = await handler(args);
                results.push({
                    name: functionName,
                    response: result,
                });
            } catch (error) {
                logger.error(`[Gemini] Function execution error: ${functionName}`, { error });
                results.push({
                    name: functionName,
                    response: {
                        success: false,
                        message: `Error executing ${functionName}: ${error.message}`,
                    },
                });
            }
        }

        return results;
    }

    /**
     * Send function results back to Gemini for final response
     */
    async sendFunctionResults(sessionId, systemInstruction, history, userMessage, functionCalls, functionResults) {
        try {
            // Build function response parts
            const functionResponseParts = functionResults.map(result => ({
                functionResponse: {
                    name: result.name,
                    response: result.response,
                },
            }));

            // Prepare API request with function results
            const requestBody = {
                systemInstruction: {
                    parts: [{ text: systemInstruction }],
                },
                contents: [
                    ...history,
                    {
                        role: 'user',
                        parts: [{ text: userMessage }],
                    },
                    {
                        role: 'model',
                        parts: functionCalls.map(fc => ({ functionCall: fc.functionCall })),
                    },
                    {
                        role: 'user',
                        parts: functionResponseParts,
                    },
                ],
            };

            logger.info(`[Gemini] Sending function results for session ${sessionId}`);

            // Call Gemini API again with function results
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];
            const content = candidate?.content;
            const textPart = content?.parts?.find(part => part.text);
            const responseText = textPart?.text || 'I processed the function results but could not generate a response.';

            // Add assistant response to history
            conversationStore.addMessage(sessionId, 'model', responseText);

            return {
                success: true,
                message: responseText,
                functionCalls: functionResults.map(r => ({
                    function: r.name,
                    result: r.response,
                })),
            };

        } catch (error) {
            logger.error(`[Gemini] Function results error: ${error.message}`, { sessionId, error });

            return {
                success: false,
                message: 'I encountered an error processing the function results. Please try again.',
                error: error.message,
            };
        }
    }

    /**
     * Clear conversation session
     */
    clearSession(sessionId) {
        conversationStore.clearSession(sessionId);
        logger.info(`[Gemini] Cleared session ${sessionId}`);
    }

    /**
     * Get conversation history
     */
    getHistory(sessionId) {
        return conversationStore.getHistory(sessionId);
    }

    /**
     * Update session context
     */
    updateContext(sessionId, context) {
        conversationStore.updateContext(sessionId, context);
    }
}

module.exports = new GeminiService();
