/**
 * Template Controller
 * Handles WhatsApp template management
 */

const templateRepo = require('../../repositories/templateRepository');
const whatsappAccountRepo = require('../../repositories/whatsappAccountRepository');
const whatsappService = require('../../services/whatsappService');

/**
 * Get templates for a store
 * GET /api/whatsapp/templates/:storeId
 */
async function getTemplates(req, res) {
    try {
        const { storeId } = req.params;
        const { status } = req.query;

        const templates = await templateRepo.findByStore(storeId, status);

        res.json({ templates });
    } catch (error) {
        console.error('[Templates] Get templates error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Create template
 * POST /api/whatsapp/templates
 */
async function createTemplate(req, res) {
    try {
        const { storeId, name, language = 'en', category = 'MARKETING', body, headerType, headerText, footer, buttons } = req.body;

        if (!storeId || !name || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get WhatsApp account
        const account = await whatsappAccountRepo.findByStoreId(storeId, true);

        if (!account || !account.wabaId) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        // Build template structure for Meta API
        const components = [];

        if (headerType && headerText) {
            components.push({
                type: 'HEADER',
                format: 'TEXT',
                text: headerText,
            });
        }

        components.push({
            type: 'BODY',
            text: body,
        });

        if (footer) {
            components.push({
                type: 'FOOTER',
                text: footer,
            });
        }

        if (buttons && buttons.length > 0) {
            components.push({
                type: 'BUTTONS',
                buttons: buttons,
            });
        }

        const templateData = {
            name,
            language,
            category,
            components,
        };

        try {
            // Submit to Meta for approval
            const result = await whatsappService.createTemplate(account.wabaId, templateData, account.accessToken);

            // Save to database
            const template = await templateRepo.create({
                storeId,
                whatsappAccountId: account.id,
                name,
                language,
                category,
                headerType,
                headerText,
                body,
                footer,
                buttons: buttons || [],
                status: result.status || 'PENDING',
                templateId: result.id,
            });

            res.json({ success: true, template });
        } catch (metaError) {
            // Save as pending even if Meta submission fails
            const template = await templateRepo.create({
                storeId,
                whatsappAccountId: account.id,
                name,
                language,
                category,
                headerType,
                headerText,
                body,
                footer,
                buttons: buttons || [],
                status: 'PENDING',
                rejectedReason: metaError.message,
            });

            throw metaError;
        }
    } catch (error) {
        console.error('[Templates] Create template error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Sync templates from Meta
 * POST /api/whatsapp/templates/:storeId/sync
 */
async function syncTemplates(req, res) {
    try {
        const { storeId } = req.params;

        // Get WhatsApp account
        const account = await whatsappAccountRepo.findByStoreId(storeId, true);

        if (!account || !account.wabaId) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        // Fetch templates from Meta
        const metaTemplates = await whatsappService.getTemplates(account.wabaId, account.accessToken);

        // Update database
        const syncResults = [];

        for (const metaTemplate of metaTemplates) {
            const existing = await templateRepo.findByNameAndLanguage(
                storeId,
                metaTemplate.name,
                metaTemplate.language
            );

            if (existing) {
                // Update status
                await templateRepo.updateStatus(existing.id, metaTemplate.status, {
                    templateId: metaTemplate.id,
                    rejectedReason: metaTemplate.rejected_reason || null,
                });
                syncResults.push({ action: 'updated', name: metaTemplate.name });
            } else {
                // Create new
                const bodyComponent = metaTemplate.components.find(c => c.type === 'BODY');

                await templateRepo.create({
                    storeId,
                    whatsappAccountId: account.id,
                    name: metaTemplate.name,
                    language: metaTemplate.language,
                    category: metaTemplate.category,
                    body: bodyComponent?.text || '',
                    status: metaTemplate.status,
                    templateId: metaTemplate.id,
                });
                syncResults.push({ action: 'created', name: metaTemplate.name });
            }
        }

        res.json({ success: true, synced: syncResults.length, results: syncResults });
    } catch (error) {
        console.error('[Templates] Sync templates error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Delete template
 * DELETE /api/whatsapp/templates/:id
 */
async function deleteTemplate(req, res) {
    try {
        const { id } = req.params;

        await templateRepo.deleteTemplate(id);

        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        console.error('[Templates] Delete template error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getTemplates,
    createTemplate,
    syncTemplates,
    deleteTemplate,
};
