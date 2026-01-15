"use strict";
/**
 * ExportService - Medicine Data Export and Serialization
 *
 * Handles serialization, deserialization, and export of medicine data
 * Requirements: 10.1, 10.2, 10.4, 10.5, 10.6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportService = exports.ExportService = void 0;
const client_1 = require("@prisma/client");
const StoreOverlayService_1 = require("./StoreOverlayService");
const prisma = new client_1.PrismaClient();
class ExportService {
    /**
     * Serialize a single medicine to JSON-compatible format
     * Requirements: 10.1
     */
    serialize(medicine) {
        return {
            canonicalId: medicine.id,
            name: medicine.name,
            genericName: medicine.genericName || undefined,
            compositionText: medicine.compositionText,
            manufacturerName: medicine.manufacturerName,
            form: medicine.form,
            packSize: medicine.packSize,
            schedule: medicine.schedule || undefined,
            requiresPrescription: medicine.requiresPrescription,
            defaultGstRate: parseFloat(medicine.defaultGstRate.toString()),
            hsnCode: medicine.hsnCode || undefined,
            primaryBarcode: medicine.primaryBarcode || undefined,
            alternateBarcodes: medicine.alternateBarcodes || [],
            status: medicine.status,
            confidenceScore: medicine.confidenceScore,
            usageCount: medicine.usageCount,
            createdAt: medicine.createdAt.toISOString(),
            updatedAt: medicine.updatedAt.toISOString(),
        };
    }
    /**
     * Deserialize JSON data back to medicine object
     * Requirements: 10.4
     */
    deserialize(data) {
        return {
            id: data.canonicalId,
            name: data.name,
            genericName: data.genericName,
            compositionText: data.compositionText,
            manufacturerName: data.manufacturerName,
            form: data.form,
            packSize: data.packSize,
            schedule: data.schedule,
            requiresPrescription: data.requiresPrescription,
            defaultGstRate: data.defaultGstRate,
            hsnCode: data.hsnCode,
            primaryBarcode: data.primaryBarcode,
            alternateBarcodes: data.alternateBarcodes,
            status: data.status,
            confidenceScore: data.confidenceScore,
            usageCount: data.usageCount,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        };
    }
    /**
     * Pretty print medicine data
     * Requirements: 10.4
     */
    prettyPrint(medicine) {
        const serialized = this.serialize(medicine);
        return JSON.stringify(serialized, null, 2);
    }
    /**
     * Export medicines changed since a specific date (incremental export)
     * Requirements: 10.2
     */
    async exportChanges(since, options = {}) {
        const { skip = 0, take = 1000, status } = options;
        const filters = {
            updatedAt: {
                gte: since,
            },
        };
        if (status) {
            filters.status = status;
        }
        const medicines = await prisma.medicineMaster.findMany({
            where: filters,
            skip,
            take,
            orderBy: { updatedAt: 'asc' },
        });
        return medicines.map((m) => this.serialize(m));
    }
    /**
     * Export medicines for a specific store (with merged overlay data)
     * Requirements: 10.6
     */
    async exportForStore(storeId, options = {}) {
        const { skip = 0, take = 1000, status } = options;
        const filters = {};
        if (status) {
            filters.status = status;
        }
        // Get medicines
        const medicines = await prisma.medicineMaster.findMany({
            where: filters,
            skip,
            take,
            orderBy: { name: 'asc' },
        });
        // Get merged data (master + overlay)
        const canonicalIds = medicines.map((m) => m.id);
        const merged = await StoreOverlayService_1.storeOverlayService.getMergedMedicines(storeId, canonicalIds);
        return merged;
    }
    /**
     * Export all medicines (paginated)
     * Requirements: 10.6
     */
    async exportAll(options = {}) {
        const { skip = 0, take = 1000, status } = options;
        const filters = {};
        if (status) {
            filters.status = status;
        }
        const medicines = await prisma.medicineMaster.findMany({
            where: filters,
            skip,
            take,
            orderBy: { name: 'asc' },
        });
        return medicines.map((m) => this.serialize(m));
    }
    /**
     * Get export statistics
     */
    async getExportStats() {
        const total = await prisma.medicineMaster.count();
        const verified = await prisma.medicineMaster.count({
            where: { status: 'VERIFIED' },
        });
        const pending = await prisma.medicineMaster.count({
            where: { status: client_1.MedicineStatus.PENDING },
        });
        const discontinued = await prisma.medicineMaster.count({
            where: { status: 'DISCONTINUED' },
        });
        return {
            total,
            verified,
            pending,
            discontinued,
            verificationRate: total > 0 ? (verified / total) * 100 : 0,
        };
    }
    /**
     * Export to JSON file format
     */
    async exportToJson(medicines, options = {}) {
        const { pretty = false } = options;
        if (pretty) {
            return JSON.stringify(medicines, null, 2);
        }
        return JSON.stringify(medicines);
    }
    /**
     * Export to CSV format
     */
    async exportToCsv(medicines) {
        if (medicines.length === 0) {
            return '';
        }
        // CSV headers
        const headers = [
            'canonicalId',
            'name',
            'genericName',
            'compositionText',
            'manufacturerName',
            'form',
            'packSize',
            'schedule',
            'requiresPrescription',
            'defaultGstRate',
            'hsnCode',
            'primaryBarcode',
            'status',
            'confidenceScore',
            'usageCount',
        ];
        const rows = [headers.join(',')];
        for (const medicine of medicines) {
            const row = [
                medicine.canonicalId,
                `"${medicine.name.replace(/"/g, '""')}"`,
                medicine.genericName ? `"${medicine.genericName.replace(/"/g, '""')}"` : '',
                `"${medicine.compositionText.replace(/"/g, '""')}"`,
                `"${medicine.manufacturerName.replace(/"/g, '""')}"`,
                medicine.form,
                `"${medicine.packSize}"`,
                medicine.schedule || '',
                medicine.requiresPrescription,
                medicine.defaultGstRate,
                medicine.hsnCode || '',
                medicine.primaryBarcode || '',
                medicine.status,
                medicine.confidenceScore,
                medicine.usageCount,
            ];
            rows.push(row.join(','));
        }
        return rows.join('\n');
    }
    /**
     * Batch export with progress tracking
     */
    async *batchExport(batchSize = 1000, options = {}) {
        const { status } = options;
        let skip = 0;
        let hasMore = true;
        while (hasMore) {
            const batch = await this.exportAll({
                skip,
                take: batchSize,
                status,
            });
            if (batch.length === 0) {
                hasMore = false;
            }
            else {
                yield batch;
                skip += batchSize;
            }
        }
    }
}
exports.ExportService = ExportService;
// Export singleton instance
exports.exportService = new ExportService();
