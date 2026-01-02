const { prisma } = require('../config/database');

class GSTRepository {
    // ======== TAX SLABS ========

    async createTaxSlab(data) {
        return prisma.taxSlab.create({
            data,
            include: {
                hsnCodes: true
            }
        });
    }

    async findTaxSlabById(id) {
        return prisma.taxSlab.findUnique({
            where: { id },
            include: {
                hsnCodes: true
            }
        });
    }

    async findTaxSlabsByStore(storeId, options = {}) {
        const { isActive } = options;

        const where = {};
        if (storeId) {
            where.OR = [
                { storeId },
                { storeId: null } // Include global tax slabs
            ];
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        return prisma.taxSlab.findMany({
            where,
            include: {
                hsnCodes: true
            },
            orderBy: {
                rate: 'asc'
            }
        });
    }

    async updateTaxSlab(id, data) {
        return prisma.taxSlab.update({
            where: { id },
            data,
            include: {
                hsnCodes: true
            }
        });
    }

    async deleteTaxSlab(id) {
        // Soft delete by marking inactive
        return prisma.taxSlab.update({
            where: { id },
            data: { isActive: false }
        });
    }

    // ======== HSN CODES ========

    async createHsnCode(data) {
        return prisma.hsnCode.create({
            data,
            include: {
                taxSlab: true
            }
        });
    }

    async findHsnCodeById(id) {
        return prisma.hsnCode.findUnique({
            where: { id },
            include: {
                taxSlab: true,
                drugs: true
            }
        });
    }

    async findHsnCodeByCode(code, storeId = null) {
        return prisma.hsnCode.findFirst({
            where: {
                code,
                OR: [
                    { storeId },
                    { storeId: null }
                ]
            },
            include: {
                taxSlab: true
            }
        });
    }

    async findHsnCodesByStore(storeId, options = {}) {
        const { search, category, isActive } = options;

        const where = {};
        if (storeId) {
            where.OR = [
                { storeId },
                { storeId: null }
            ];
        }
        if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (category) {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        return prisma.hsnCode.findMany({
            where,
            include: {
                taxSlab: true
            },
            orderBy: {
                code: 'asc'
            }
        });
    }

    async updateHsnCode(id, data) {
        return prisma.hsnCode.update({
            where: { id },
            data,
            include: {
                taxSlab: true
            }
        });
    }

    async deleteHsnCode(id) {
        // Soft delete
        return prisma.hsnCode.update({
            where: { id },
            data: { isActive: false }
        });
    }

    // ======== BULK OPERATIONS ========

    async seedDefaultTaxSlabs(storeId = null) {
        const defaultSlabs = [
            {
                storeId,
                name: 'Exempt (0%)',
                rate: 0,
                taxType: 'EXEMPT',
                isSplit: false,
                cgstRate: 0,
                sgstRate: 0,
                igstRate: 0
            },
            {
                storeId,
                name: 'GST 5%',
                rate: 5,
                taxType: 'GST',
                isSplit: true,
                cgstRate: 2.5,
                sgstRate: 2.5,
                igstRate: 5
            },
            {
                storeId,
                name: 'GST 12%',
                rate: 12,
                taxType: 'GST',
                isSplit: true,
                cgstRate: 6,
                sgstRate: 6,
                igstRate: 12
            },
            {
                storeId,
                name: 'GST 18%',
                rate: 18,
                taxType: 'GST',
                isSplit: true,
                cgstRate: 9,
                sgstRate: 9,
                igstRate: 18
            },
            {
                storeId,
                name: 'GST 28%',
                rate: 28,
                taxType: 'GST',
                isSplit: true,
                cgstRate: 14,
                sgstRate: 14,
                igstRate: 28
            }
        ];

        return prisma.taxSlab.createMany({
            data: defaultSlabs,
            skipDuplicates: true
        });
    }

    async seedPharmacyHsnCodes(storeId = null) {
        // Get the default tax slabs first
        const slabs = await this.findTaxSlabsByStore(storeId, { isActive: true });
        const gst12 = slabs.find(s => s.rate === 12);
        const gst18 = slabs.find(s => s.rate === 18);
        const gst5 = slabs.find(s => s.rate === 5);
        const exempt = slabs.find(s => s.rate === 0);

        if (!gst12 || !gst18 || !gst5 || !exempt) {
            throw new Error('Default tax slabs must be created before seeding HSN codes');
        }

        const pharmacyHsnCodes = [
            {
                storeId,
                code: '3004.90.99',
                description: 'Medicaments for retail sale',
                taxSlabId: gst12.id,
                category: 'Medicines'
            },
            {
                storeId,
                code: '3003.90.00',
                description: 'Ayurvedic/Homeopathic medicines',
                taxSlabId: gst12.id,
                category: 'Medicines'
            },
            {
                storeId,
                code: '3005.90.00',
                description: 'First aid boxes and kits',
                taxSlabId: gst12.id,
                category: 'Medical Supplies'
            },
            {
                storeId,
                code: '9018.90.10',
                description: 'Surgical instruments',
                taxSlabId: gst12.id,
                category: 'Surgical'
            },
            {
                storeId,
                code: '9018.90.90',
                description: 'Other medical instruments',
                taxSlabId: gst12.id,
                category: 'Medical Equipment'
            },
            {
                storeId,
                code: '3307.90.00',
                description: 'Personal care and cosmetics',
                taxSlabId: gst18.id,
                category: 'Cosmetics'
            },
            {
                storeId,
                code: '4015.19.00',
                description: 'Surgical gloves',
                taxSlabId: gst12.id,
                category: 'Medical Supplies'
            },
            {
                storeId,
                code: '3006.10.00',
                description: 'Sterile surgical catgut',
                taxSlabId: gst12.id,
                category: 'Surgical'
            },
            {
                storeId,
                code: '3004.10.00',
                description: 'Penicillins and their derivatives',
                taxSlabId: gst5.id,
                category: 'Medicines'
            },
            {
                storeId,
                code: '3004.20.00',
                description: 'Antibiotics',
                taxSlabId: exempt.id,
                category: 'Medicines'
            }
        ];

        return prisma.hsnCode.createMany({
            data: pharmacyHsnCodes,
            skipDuplicates: true
        });
    }
}

module.exports = new GSTRepository();
