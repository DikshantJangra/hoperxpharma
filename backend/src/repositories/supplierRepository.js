const prisma = require('../db/prisma');
const { buildOrderBy } = require('../utils/queryParser');

/**
 * Supplier Repository - Data access layer for supplier operations
 */
class SupplierRepository {
    /**
     * Find suppliers with pagination and filtering
     */
    async findSuppliers({ storeId, page = 1, limit = 20, search, category, status, sortConfig }) {
        if (!storeId) {
            throw new Error('storeId is required for findSuppliers');
        }

        const skip = (page - 1) * limit;

        const where = {
            storeId,
            deletedAt: null,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { gstin: { contains: search, mode: 'insensitive' } },
                    { contactName: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(category && { category }),
            ...(status && { status }),
        };

        // Build dynamic orderBy
        const orderBy = buildOrderBy(sortConfig, { createdAt: 'desc' });

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                include: {
                    licenses: {
                        where: { validTo: { gte: new Date() } },
                        orderBy: { validTo: 'asc' },
                    },
                },
                orderBy,
            }),
            prisma.supplier.count({ where }),
        ]);

        return { suppliers, total };
    }

    /**
     * Find supplier by ID
     */
    async findById(id, storeId = null) {
        const where = {
            id,
            deletedAt: null,
            ...(storeId && { storeId })
        };

        return await prisma.supplier.findUnique({
            where,
            include: {
                licenses: true,
                purchaseOrders: {
                    where: storeId ? { storeId } : {},
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                returns: {
                    where: storeId ? { storeId } : {},
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    /**
     * Create supplier
     */
    async create(supplierData) {
        if (!supplierData.storeId) {
            throw new Error('storeId is required to create a supplier');
        }

        const { licenses, ...supplierInfo } = supplierData;

        return await prisma.$transaction(async (tx) => {
            const supplier = await tx.supplier.create({
                data: supplierInfo,
            });

            if (licenses && licenses.length > 0) {
                await tx.supplierLicense.createMany({
                    data: licenses.map((license) => ({
                        ...license,
                        supplierId: supplier.id,
                    })),
                });
            }

            return supplier;
        });
    }

    /**
     * Update supplier
     */
    async update(id, supplierData) {
        const { licenses, ...supplierInfo } = supplierData;

        return await prisma.$transaction(async (tx) => {
            const supplier = await tx.supplier.update({
                where: { id },
                data: supplierInfo,
            });

            // If licenses are provided, replace existing ones
            if (licenses) {
                await tx.supplierLicense.deleteMany({
                    where: { supplierId: id },
                });

                if (licenses.length > 0) {
                    await tx.supplierLicense.createMany({
                        data: licenses.map((license) => ({
                            ...license,
                            supplierId: id,
                        })),
                    });
                }
            }

            return supplier;
        });
    }

    /**
     * Soft delete supplier
     */
    async softDelete(id) {
        return await prisma.supplier.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Get supplier statistics
     */
    async getStats(storeId) {
        if (!storeId) {
            throw new Error('storeId is required for getStats');
        }

        const [total, active, expiringLicenses] = await Promise.all([
            prisma.supplier.count({
                where: { storeId, deletedAt: null },
            }),
            prisma.supplier.count({
                where: { storeId, deletedAt: null, status: 'Active' },
            }),
            prisma.supplierLicense.count({
                where: {
                    supplier: { storeId },
                    validTo: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                    },
                },
            }),
        ]);

        // Get outstanding amount from pending POs for this store
        const outstandingResult = await prisma.$queryRaw`
            SELECT COALESCE(SUM(total), 0) as "outstanding"
            FROM "PurchaseOrder"
            WHERE "storeId" = ${storeId}
            AND "deletedAt" IS NULL
            AND status IN ('SENT', 'PARTIALLY_RECEIVED')
        `;

        return {
            total,
            active,
            expiringLicenses,
            outstanding: parseFloat(outstandingResult[0]?.outstanding || 0),
        };
    }

    /**
     * Check if supplier with GSTIN exists (within store)
     */
    async findByGSTIN(gstin, storeId) {
        if (!storeId) {
            throw new Error('storeId is required for findByGSTIN');
        }

        return await prisma.supplier.findFirst({
            where: { gstin, storeId, deletedAt: null },
        });
    }

    /**
     * Find supplier by name (exact, case-insensitive, within store)
     */
    async findByName(name, storeId) {
        if (!storeId) {
            throw new Error('storeId is required for findByName');
        }

        return await prisma.supplier.findFirst({
            where: {
                name: { equals: name.trim(), mode: 'insensitive' },
                storeId,
                deletedAt: null
            },
        });
    }
}

module.exports = new SupplierRepository();
