const database = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

const prisma = database.getClient();

/**
 * Sale Draft Service - Handles draft sales for POS
 */
class SaleDraftService {
    /**
     * Create or update a draft
     */
    async saveDraft(draftData) {
        const { storeId, customerId, customerName, customerPhone, items, dispenseFor, subtotal, taxAmount, total, createdBy } = draftData;

        // Calculate expiry date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Generate draft number
        const draftNumber = await this.generateDraftNumber(storeId);

        const draft = await prisma.saleDraft.create({
            data: {
                storeId,
                draftNumber,
                customerId,
                customerName,
                customerPhone,
                items: JSON.stringify(items), // Serialize items array
                dispenseFor,
                subtotal,
                taxAmount,
                total,
                createdBy,
                expiresAt,
            },
        });

        logger.info(`Draft created: ${draftNumber} for store ${storeId}`);
        return draft;
    }

    /**
     * Update existing draft
     */
    async updateDraft(draftId, draftData) {
        const { customerId, customerName, customerPhone, items, dispenseFor, subtotal, taxAmount, total } = draftData;

        const draft = await prisma.saleDraft.update({
            where: { id: draftId },
            data: {
                customerId,
                customerName,
                customerPhone,
                items: JSON.stringify(items),
                dispenseFor,
                subtotal,
                taxAmount,
                total,
            },
        });

        logger.info(`Draft updated: ${draft.draftNumber}`);
        return draft;
    }

    /**
     * Get all drafts for a store
     */
    async getDrafts(storeId, filters = {}) {
        const { page = 1, limit = 20, search } = filters;

        const skip = (page - 1) * limit;
        const take = parseInt(limit, 10); // Convert to integer

        const where = {
            storeId,
            expiresAt: { gte: new Date() }, // Only non-expired drafts
        };

        if (search) {
            where.OR = [
                { draftNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [drafts, total] = await Promise.all([
            prisma.saleDraft.findMany({
                where,
                skip,
                take,
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.saleDraft.count({ where }),
        ]);

        return { drafts, total };
    }

    /**
     * Get draft by ID
     */
    async getDraftById(draftId) {
        const draft = await prisma.saleDraft.findUnique({
            where: { id: draftId },
        });

        if (!draft) {
            throw ApiError.notFound('Draft not found');
        }

        return {
            ...draft,
            items: JSON.parse(draft.items),
        };
    }

    /**
     * Convert draft to completed sale
     */
    async convertDraftToSale(draftId, paymentSplits) {
        const draft = await this.getDraftById(draftId);
        const items = JSON.parse(draft.items);

        // Use sale service to create the sale
        const saleService = require('./saleService');

        const saleData = {
            storeId: draft.storeId,
            patientId: draft.customerId,
            dispenseForPatientId: draft.dispenseFor?.id,
            subtotal: draft.subtotal,
            discountAmount: 0,
            taxAmount: draft.taxAmount,
            roundOff: 0,
            total: draft.total,
            soldBy: draft.createdBy,
        };

        const sale = await saleService.createSale({
            ...saleData,
            items,
            paymentSplits,
        });

        // Delete the draft after successful conversion
        await prisma.saleDraft.delete({
            where: { id: draftId },
        });

        logger.info(`Draft ${draft.draftNumber} converted to sale ${sale.invoiceNumber}`);
        return sale;
    }

    /**
     * Delete draft
     */
    async deleteDraft(draftId) {
        await prisma.saleDraft.delete({
            where: { id: draftId },
        });

        logger.info(`Draft deleted: ${draftId}`);
    }

    /**
     * Cleanup expired drafts (cron job)
     */
    async cleanupExpiredDrafts() {
        const result = await prisma.saleDraft.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });

        logger.info(`Cleaned up ${result.count} expired drafts`);
        return result.count;
    }

    /**
     * Generate draft number
     */
    async generateDraftNumber(storeId) {
        const today = new Date();
        const prefix = `DRF${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

        const lastDraft = await prisma.saleDraft.findFirst({
            where: {
                storeId,
                draftNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastDraft) {
            const lastSequence = parseInt(lastDraft.draftNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }
}

module.exports = new SaleDraftService();
