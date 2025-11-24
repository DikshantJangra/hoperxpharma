const database = require('../config/database');

const prisma = database.getClient();

/**
 * Supplier Repository - Data access layer for supplier operations
 */
class SupplierRepository {
    /**
     * Find suppliers with pagination and filtering
     */
    async findSuppliers({ page = 1, limit = 20, search, category, status }) {
        const skip = (page - 1) * limit;

        const where = {
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
                orderBy: { createdAt: 'desc' },
            }),
            prisma.supplier.count({ where }),
        ]);

        return { suppliers, total };
    }

    /**
     * Find supplier by ID
     */
    async findById(id) {
        return await prisma.supplier.findUnique({
            where: { id, deletedAt: null },
            include: {
                licenses: true,
                purchaseOrders: {
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
    async getStats() {
        const [total, active, expiringLicenses] = await Promise.all([
            prisma.supplier.count({
                where: { deletedAt: null },
            }),
            prisma.supplier.count({
                where: { deletedAt: null, status: 'Active' },
            }),
            prisma.supplierLicense.count({
                where: {
                    validTo: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                    },
                },
            }),
        ]);

        // Get outstanding amount from pending POs
        const outstandingResult = await prisma.$queryRaw`
            SELECT COALESCE(SUM(total), 0) as "outstanding"
            FROM "PurchaseOrder"
            WHERE "deletedAt" IS NULL
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
     * Check if supplier with GSTIN exists
     */
    async findByGSTIN(gstin) {
        return await prisma.supplier.findFirst({
            where: { gstin, deletedAt: null },
        });
    }
}

module.exports = new SupplierRepository();
