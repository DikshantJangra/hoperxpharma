
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

class GSTLedgerService {
    /**
     * Fetch Ledger Entries with Pagination and Filters
     */
    async getLedgerEntries(storeId, { page = 1, limit = 20, type, startDate, endDate, search }) {
        try {
            const skip = (page - 1) * limit;
            const where = {
                storeId,
                ...(type && { eventType: type }),
                ...(startDate && endDate && {
                    date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                }),
                ...(search && {
                    OR: [
                        { eventId: { contains: search, mode: 'insensitive' } },
                        { hsnCode: { contains: search, mode: 'insensitive' } }
                    ]
                })
            };

            const [entries, total] = await prisma.$transaction([
                prisma.gSTLedgerEntry.findMany({
                    where,
                    orderBy: { date: 'desc' },
                    take: Number(limit),
                    skip: Number(skip)
                }),
                prisma.gSTLedgerEntry.count({ where })
            ]);

            return {
                data: entries,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('[GSTLedgerService] getLedgerEntries Error:', error);
            logger.error('[GSTLedgerService] Failed to fetch entries', error);
            throw error;
        }
    }
}

module.exports = new GSTLedgerService();
