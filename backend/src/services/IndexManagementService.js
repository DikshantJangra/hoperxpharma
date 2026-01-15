"use strict";
/**
 * IndexManagementService - Typesense Index Management
 *
 * Handles indexing, updating, and removing documents from the Typesense search index.
 * Requirements: 3.7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexManagementService = exports.IndexManagementService = void 0;
const client_1 = require("../lib/typesense/client");
const client_2 = require("@prisma/client");
const prisma = new client_2.PrismaClient();
class IndexManagementService {
    constructor() {
        this.collectionName = client_1.typesenseConfig.collectionName;
    }
    /**
     * Convert MedicineMaster to Typesense document format
     */
    toDocument(medicine) {
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
            status: medicine.status,
            defaultGstRate: parseFloat(medicine.defaultGstRate.toString()),
            usageCount: medicine.usageCount,
            confidenceScore: medicine.confidenceScore,
            primaryBarcode: medicine.primaryBarcode || undefined,
            updatedAt: Math.floor(new Date(medicine.updatedAt).getTime() / 1000),
        };
    }
    /**
     * Index a single medicine
     * Requirements: 3.7
     */
    async indexMedicine(canonicalId) {
        try {
            // Fetch medicine from database
            const medicine = await prisma.medicineMaster.findUnique({
                where: { id: canonicalId },
            });
            if (!medicine) {
                throw new Error(`Medicine with ID ${canonicalId} not found`);
            }
            // Convert to document format
            const document = this.toDocument(medicine);
            // Upsert to Typesense
            await client_1.typesenseClient
                .collections(this.collectionName)
                .documents()
                .upsert(document);
            console.log(`✅ Indexed medicine: ${medicine.name} (${canonicalId})`);
        }
        catch (error) {
            console.error(`Failed to index medicine ${canonicalId}:`, error);
            throw error;
        }
    }
    /**
     * Bulk index medicines
     * Requirements: 3.7
     */
    async bulkIndex(canonicalIds) {
        let success = 0;
        let failed = 0;
        try {
            // Fetch medicines from database
            const medicines = await prisma.medicineMaster.findMany({
                where: {
                    id: {
                        in: canonicalIds,
                    },
                },
            });
            if (medicines.length === 0) {
                console.log('No medicines found to index');
                return { success: 0, failed: 0 };
            }
            // Convert to document format
            const documents = medicines.map((m) => this.toDocument(m));
            // Bulk import to Typesense
            const results = await client_1.typesenseClient
                .collections(this.collectionName)
                .documents()
                .import(documents, { action: 'upsert' });
            // Parse results - results is an array of ImportResponse objects
            const resultArray = Array.isArray(results) ? results : [results];
            for (const result of resultArray) {
                if (result.success) {
                    success++;
                }
                else {
                    failed++;
                    console.error('Failed to index document:', result.error);
                }
            }
            console.log(`✅ Bulk index complete: ${success} success, ${failed} failed`);
            return { success, failed };
        }
        catch (error) {
            console.error('Bulk index error:', error);
            throw error;
        }
    }
    /**
     * Remove medicine from index
     * Requirements: 3.7
     */
    async removeFromIndex(canonicalId) {
        try {
            await client_1.typesenseClient
                .collections(this.collectionName)
                .documents(canonicalId)
                .delete();
            console.log(`✅ Removed medicine from index: ${canonicalId}`);
        }
        catch (error) {
            if (error.httpStatus === 404) {
                console.log(`ℹ️  Medicine ${canonicalId} not found in index`);
                return;
            }
            console.error(`Failed to remove medicine ${canonicalId} from index:`, error);
            throw error;
        }
    }
    /**
     * Rebuild entire index from database
     * Requirements: 3.7
     */
    async rebuildIndex() {
        console.log('🔄 Starting full index rebuild...');
        try {
            // Get total count
            const total = await prisma.medicineMaster.count();
            console.log(`Found ${total} medicines to index`);
            let success = 0;
            let failed = 0;
            const batchSize = 1000;
            // Process in batches
            for (let skip = 0; skip < total; skip += batchSize) {
                const medicines = await prisma.medicineMaster.findMany({
                    skip,
                    take: batchSize,
                });
                const documents = medicines.map((m) => this.toDocument(m));
                // Bulk import batch
                const results = await client_1.typesenseClient
                    .collections(this.collectionName)
                    .documents()
                    .import(documents, { action: 'upsert' });
                // Parse results - results is an array of ImportResponse objects
                const resultArray = Array.isArray(results) ? results : [results];
                for (const result of resultArray) {
                    if (result.success) {
                        success++;
                    }
                    else {
                        failed++;
                    }
                }
                console.log(`Progress: ${skip + medicines.length}/${total} (${success} success, ${failed} failed)`);
            }
            console.log(`✅ Index rebuild complete: ${success}/${total} indexed, ${failed} failed`);
            return { total, success, failed };
        }
        catch (error) {
            console.error('Index rebuild error:', error);
            throw error;
        }
    }
    /**
     * Get index health and statistics
     */
    async getIndexHealth() {
        try {
            const collection = await client_1.typesenseClient
                .collections(this.collectionName)
                .retrieve();
            const dbCount = await prisma.medicineMaster.count();
            return {
                collectionName: collection.name,
                documentsInIndex: collection.num_documents,
                documentsInDatabase: dbCount,
                inSync: collection.num_documents === dbCount,
                createdAt: collection.created_at,
            };
        }
        catch (error) {
            console.error('Failed to get index health:', error);
            throw error;
        }
    }
}
exports.IndexManagementService = IndexManagementService;
// Export singleton instance
exports.indexManagementService = new IndexManagementService();
