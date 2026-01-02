const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sales Ledger Repository
 * Handles database queries for sales transaction ledger
 */
class SalesLedgerRepository {
    /**
     * Get sales ledger with filters
     * @param {Object} params - { storeId, startDate, endDate, paymentMethod, reconStatus, tags, sortBy, sortDirection, limit, offset }
     * @returns {Promise<Object>} { rows, total }
     */
    async getLedger({ storeId, startDate, endDate, paymentMethod, reconStatus, tags, sortBy = 'createdAt', sortDirection = 'desc', limit = 50, offset = 0 }) {
        const where = {
            storeId,
            deletedAt: null,
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        };

        // Filter by payment method if specified
        if (paymentMethod) {
            where.paymentSplits = {
                some: {
                    paymentMethod
                }
            };
        }

        // Filter by status (refunded, etc.)
        if (tags && tags.includes('refund')) {
            where.status = {
                in: ['REFUNDED', 'PARTIALLY_REFUNDED']
            };
        }

        // Map frontend sort fields to database fields
        const sortFieldMap = {
            'date': 'createdAt',
            'invoice': 'invoiceNumber',
            'amount': 'total',
            'customer': 'patientId'
        };
        const dbSortField = sortFieldMap[sortBy] || 'createdAt';

        // Execute queries in parallel
        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where,
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    paymentSplits: true,
                    refunds: {
                        select: {
                            id: true,
                            refundAmount: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    [dbSortField]: sortDirection
                },
                take: limit,
                skip: offset
            }),
            prisma.sale.count({ where })
        ]);

        // Transform to ledger row format
        const rows = sales.map(sale => this._transformToLedgerRow(sale));

        return { rows, total };
    }

    /**
     * Get sales summary for the period
     * @param {Object} params - { storeId, startDate, endDate }
     * @returns {Promise<Object>} Summary metrics
     */
    async getSummary({ storeId, startDate, endDate }) {
        const where = {
            storeId,
            deletedAt: null,
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        };

        // Get all sales with payment splits
        const sales = await prisma.sale.findMany({
            where,
            include: {
                paymentSplits: true,
                refunds: {
                    where: {
                        status: 'COMPLETED'
                    }
                }
            }
        });

        // Calculate totals
        let revenue = 0;
        let cash = 0;
        let card = 0;
        let upi = 0;
        let wallet = 0;
        let outstanding = 0;
        let refundCount = 0;
        let refundAmount = 0;

        sales.forEach(sale => {
            // Add to revenue
            revenue += parseFloat(sale.total);

            // Calculate outstanding (unpaid or partial)
            if (sale.paymentStatus === 'UNPAID' || sale.paymentStatus === 'PARTIAL') {
                outstanding += parseFloat(sale.balance);
            }

            // Sum payment splits by method
            sale.paymentSplits.forEach(split => {
                const amount = parseFloat(split.amount);
                switch (split.paymentMethod) {
                    case 'CASH':
                        cash += amount;
                        break;
                    case 'CARD':
                        card += amount;
                        break;
                    case 'UPI':
                        upi += amount;
                        break;
                    case 'WALLET':
                        wallet += amount;
                        break;
                }
            });

            // Count refunds
            if (sale.refunds && sale.refunds.length > 0) {
                refundCount += sale.refunds.length;
                sale.refunds.forEach(refund => {
                    refundAmount += parseFloat(refund.refundAmount);
                });
            }
        });

        // Calculate reconciliation rate (for now, assume all paid sales are reconciled)
        const paidSales = sales.filter(s => s.paymentStatus === 'PAID').length;
        const reconRate = sales.length > 0 ? (paidSales / sales.length) * 100 : 100;

        return {
            revenue,
            cash,
            card,
            upi,
            wallet,
            outstanding,
            refunds: {
                count: refundCount,
                amount: refundAmount
            },
            reconRate: Math.round(reconRate * 10) / 10 // Round to 1 decimal
        };
    }

    /**
     * Transform Sale model to LedgerRow format
     * @param {Object} sale - Prisma Sale object with relations
     * @returns {Object} LedgerRow
     * @private
     */
    _transformToLedgerRow(sale) {
        // Determine primary payment method
        const primaryPayment = sale.paymentSplits[0] || { paymentMethod: 'CASH' };

        // Determine reconciliation status based on payment status
        let reconStatus = 'MATCHED';
        if (sale.paymentStatus === 'UNPAID' || sale.paymentStatus === 'PARTIAL') {
            reconStatus = 'UNMATCHED';
        } else if (sale.paymentStatus === 'OVERDUE') {
            reconStatus = 'PARTIAL';
        }

        // Build tags
        const tags = [];
        if (sale.status === 'REFUNDED' || sale.status === 'PARTIALLY_REFUNDED') {
            tags.push('refund');
        }
        if (sale.invoiceType === 'CREDIT_NOTE') {
            tags.push('credit-note');
        }

        return {
            id: sale.id,
            type: sale.invoiceType === 'CREDIT_NOTE' ? 'REFUND' : 'INVOICE',
            date: sale.createdAt.toISOString(),
            invoiceId: sale.invoiceNumber,
            storeId: sale.storeId,
            source: 'POS', // Can be enhanced with actual source tracking
            customer: {
                id: sale.patient?.id || 'walk-in',
                name: sale.patient
                    ? `${sale.patient.firstName} ${sale.patient.lastName}`.trim()
                    : 'Walk-in Customer'
            },
            gross: parseFloat(sale.subtotal),
            tax: parseFloat(sale.taxAmount),
            net: parseFloat(sale.total),
            paymentMethod: primaryPayment.paymentMethod,
            paymentStatus: sale.paymentStatus,
            reconStatus,
            tags,
            bankTransactionId: primaryPayment.upiTransactionId ||
                primaryPayment.cardAuthCode ||
                primaryPayment.walletTxnId ||
                null
        };
    }
}

module.exports = new SalesLedgerRepository();
