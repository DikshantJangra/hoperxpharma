/**
 * In-Memory Search Service
 * 
 * Ultra-fast medicine search using in-memory data structure
 * - Loads all medicines into RAM (~80MB for 250K records)
 * - Builds prefix tree (Trie) for instant autocomplete
 * - Syncs with database on changes
 * - Falls back to PostgreSQL if not loaded
 */

const prisma = require('../db/prisma');
const EventEmitter = require('events');

class InMemorySearchService extends EventEmitter {
    constructor() {
        super();
        this.medicines = new Map(); // id -> medicine object
        this.nameIndex = new Map(); // lowercase name -> Set of ids
        this.manufacturerIndex = new Map(); // lowercase manufacturer -> Set of ids
        this.compositionIndex = new Map(); // lowercase composition -> Set of ids
        this.barcodeIndex = new Map(); // barcode -> id
        this.prefixTrie = {}; // Trie for autocomplete

        this.isLoaded = false;
        this.isLoading = false;
        this.lastSyncTime = null;
        this.medicineCount = 0;

        // ⚠️ DISABLED: Auto-initialization causes out-of-memory errors in production
        // This service loads ALL medicines into RAM, which exceeds 512MB limit
        // Use PostgresSearchService instead for production environments
        // this.initialize();
    }

    /**
     * Initialize and load data
     */
    async initialize() {
        try {
            console.log('🔄 Initializing In-Memory Search Service...');
            console.log('📊 Starting to load medicines from database...');
            await this.loadAllMedicines();

            // Start background sync every 5 minutes
            this.startBackgroundSync();

            console.log(`✅ In-Memory Search Service ready (${this.medicineCount} medicines loaded)`);
            console.log(`📊 Memory indexes built: ${this.nameIndex.size} names, ${this.manufacturerIndex.size} manufacturers`);
        } catch (error) {
            console.error('❌ Failed to initialize In-Memory Search:', error);
            this.isLoaded = false;
        }
    }

    /**
     * Load all medicines from database into memory
     */
    async loadAllMedicines() {
        if (this.isLoading) {
            console.log('⏳ Already loading...');
            return;
        }

        this.isLoading = true;
        const startTime = Date.now();

        try {
            console.log('📊 Loading medicines from database...');

            const medicines = await prisma.medicineMaster.findMany({
                where: {
                    status: { not: 'DISCONTINUED' }
                },
                select: {
                    id: true,
                    name: true,
                    genericName: true,
                    strength: true,
                    form: true,
                    manufacturerName: true,
                    schedule: true,
                    compositionText: true,
                    primaryBarcode: true,
                    status: true,
                    usageCount: true,
                    requiresPrescription: true,
                },
            });

            // Clear existing data
            this.medicines.clear();
            this.nameIndex.clear();
            this.manufacturerIndex.clear();
            this.compositionIndex.clear();
            this.barcodeIndex.clear();
            this.prefixTrie = {};

            // Build indexes
            for (const medicine of medicines) {
                this.addMedicineToIndex(medicine);
            }

            this.medicineCount = medicines.length;
            this.isLoaded = true;
            this.lastSyncTime = new Date();

            const duration = Date.now() - startTime;
            console.log(`✅ Loaded ${this.medicineCount} medicines in ${duration}ms`);
            console.log(`📊 Memory usage: ~${Math.round(this.medicineCount * 0.3)}KB`);

            this.emit('loaded', { count: this.medicineCount, duration });
        } catch (error) {
            console.error('❌ Failed to load medicines:', error);
            this.isLoaded = false;
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Add medicine to all indexes
     */
    addMedicineToIndex(medicine) {
        const id = medicine.id;

        // Store medicine
        this.medicines.set(id, medicine);

        // Index by name
        if (medicine.name) {
            const nameLower = medicine.name.toLowerCase();
            if (!this.nameIndex.has(nameLower)) {
                this.nameIndex.set(nameLower, new Set());
            }
            this.nameIndex.get(nameLower).add(id);

            // Add to prefix trie
            this.addToTrie(nameLower, id);
        }

        // Index by manufacturer
        if (medicine.manufacturerName) {
            const mfgLower = medicine.manufacturerName.toLowerCase();
            if (!this.manufacturerIndex.has(mfgLower)) {
                this.manufacturerIndex.set(mfgLower, new Set());
            }
            this.manufacturerIndex.get(mfgLower).add(id);
        }

        // Index by composition
        if (medicine.compositionText) {
            const compLower = medicine.compositionText.toLowerCase();
            if (!this.compositionIndex.has(compLower)) {
                this.compositionIndex.set(compLower, new Set());
            }
            this.compositionIndex.get(compLower).add(id);
        }

        // Index by barcode
        if (medicine.primaryBarcode) {
            this.barcodeIndex.set(medicine.primaryBarcode, id);
        }
    }

    /**
     * Add word to prefix trie for autocomplete
     */
    addToTrie(word, medicineId) {
        let node = this.prefixTrie;
        for (const char of word) {
            if (!node[char]) {
                node[char] = { ids: new Set(), children: {} };
            }
            node[char].ids.add(medicineId);
            node = node[char].children;
        }
    }

    /**
     * Calculate Levenshtein distance (fuzzy matching)
     */
    levenshteinDistance(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[len1][len2];
    }

    /**
     * Calculate similarity score (0-1, higher is better)
     */
    calculateSimilarity(str1, str2) {
        const maxLen = Math.max(str1.length, str2.length);
        if (maxLen === 0) return 1;
        const distance = this.levenshteinDistance(str1, str2);
        return 1 - distance / maxLen;
    }

    /**
     * Search medicines with filters and fuzzy matching
     */
    async search(searchQuery) {
        // Fallback to PostgreSQL if not loaded
        if (!this.isLoaded) {
            console.warn('⚠️  In-memory search not loaded, falling back to PostgreSQL');
            const PostgresSearchService = require('./PostgresSearchService').postgresSearchService;
            return PostgresSearchService.search(searchQuery);
        }

        const {
            query,
            manufacturer,
            schedule,
            requiresPrescription,
            form,
            limit = 20,
            offset = 0,
        } = searchQuery;

        const queryLower = query.toLowerCase();
        let resultIds = new Set();
        const scores = new Map(); // Track relevance scores

        // Exact and partial matches in name, generic name, composition
        for (const [name, ids] of this.nameIndex) {
            if (name.includes(queryLower)) {
                ids.forEach(id => {
                    resultIds.add(id);
                    // Calculate relevance score
                    const similarity = this.calculateSimilarity(queryLower, name);
                    const existingScore = scores.get(id) || 0;
                    scores.set(id, Math.max(existingScore, similarity));
                });
            }
        }

        for (const [comp, ids] of this.compositionIndex) {
            if (comp.includes(queryLower)) {
                ids.forEach(id => {
                    resultIds.add(id);
                    const similarity = this.calculateSimilarity(queryLower, comp);
                    const existingScore = scores.get(id) || 0;
                    scores.set(id, Math.max(existingScore, similarity * 0.8)); // Composition matches slightly lower
                });
            }
        }

        // Fuzzy matching if no exact matches found
        if (resultIds.size === 0 && queryLower.length >= 3) {
            console.log('🔍 No exact matches, trying fuzzy search...');
            const fuzzyThreshold = 0.6; // 60% similarity required

            for (const [name, ids] of this.nameIndex) {
                const similarity = this.calculateSimilarity(queryLower, name);
                if (similarity >= fuzzyThreshold) {
                    ids.forEach(id => {
                        resultIds.add(id);
                        scores.set(id, similarity);
                    });
                }
            }
        }

        // Apply filters
        let results = Array.from(resultIds)
            .map(id => {
                const med = this.medicines.get(id);
                return {
                    ...med,
                    score: scores.get(id) || 0.5
                };
            })
            .filter(med => {
                if (manufacturer && !med.manufacturerName?.toLowerCase().includes(manufacturer.toLowerCase())) {
                    return false;
                }
                if (schedule && med.schedule !== schedule) {
                    return false;
                }
                if (requiresPrescription !== undefined && med.requiresPrescription !== requiresPrescription) {
                    return false;
                }
                if (form && !med.form?.toLowerCase().includes(form.toLowerCase())) {
                    return false;
                }
                return true;
            });

        // Sort by score first, then usage count
        results.sort((a, b) => {
            const scoreDiff = (b.score || 0) - (a.score || 0);
            if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
            return (b.usageCount || 0) - (a.usageCount || 0);
        });

        // Paginate
        const paginatedResults = results.slice(offset, offset + limit);

        console.log(`🔍 Search "${query}": ${results.length} results (showing ${paginatedResults.length})`);

        return paginatedResults;
    }

    /**
     * Autocomplete using prefix trie
     */
    async autocomplete(options) {
        if (!this.isLoaded) {
            return { suggestions: [], count: 0 };
        }

        const { query, limit = 10 } = options;

        if (!query || query.length < 2) {
            return { suggestions: [], count: 0 };
        }

        const queryLower = query.toLowerCase();
        const resultIds = this.searchTrie(queryLower);

        const results = Array.from(resultIds)
            .map(id => this.medicines.get(id))
            .filter(Boolean)
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
            .slice(0, limit);

        return {
            suggestions: results,
            count: results.length,
        };
    }

    /**
     * Search prefix trie
     */
    searchTrie(prefix) {
        let node = this.prefixTrie;

        // Navigate to prefix
        for (const char of prefix) {
            if (!node[char]) {
                return new Set();
            }
            node = node[char];
        }

        // Collect all IDs under this prefix
        return node.ids || new Set();
    }

    /**
     * Search by barcode
     */
    async searchByBarcode(barcode) {
        if (!this.isLoaded) {
            const PostgresSearchService = require('./PostgresSearchService').postgresSearchService;
            return PostgresSearchService.searchByBarcode(barcode);
        }

        const id = this.barcodeIndex.get(barcode);
        if (!id) {
            return [];
        }

        const medicine = this.medicines.get(id);
        return medicine ? [{ ...medicine, score: 1 }] : [];
    }

    /**
     * Search by composition
     */
    async searchByComposition(salt) {
        return this.search({ query: salt, limit: 20 });
    }

    /**
     * Search by manufacturer
     */
    async searchByManufacturer(manufacturer) {
        return this.search({ query: manufacturer, manufacturer, limit: 20 });
    }

    /**
     * Get stats
     */
    async getIndexStats() {
        const stats = {
            name: 'medicines',
            numDocuments: this.medicineCount,
            totalDocuments: this.medicineCount, // Add this for frontend compatibility
            isLoaded: this.isLoaded,
            lastSyncTime: this.lastSyncTime,
            createdAt: Date.now(),
        };

        console.log(`📊 Stats requested: ${this.medicineCount} medicines loaded, isLoaded: ${this.isLoaded}`);
        return stats;
    }

    /**
     * Sync single medicine (called when medicine is updated)
     */
    async syncMedicine(medicineId) {
        try {
            const medicine = await prisma.medicineMaster.findUnique({
                where: { id: medicineId },
                select: {
                    id: true,
                    name: true,
                    genericName: true,
                    strength: true,
                    form: true,
                    manufacturerName: true,
                    schedule: true,
                    compositionText: true,
                    primaryBarcode: true,
                    status: true,
                    usageCount: true,
                    requiresPrescription: true,
                },
            });

            if (!medicine || medicine.status === 'DISCONTINUED') {
                // Remove from index
                this.removeMedicineFromIndex(medicineId);
            } else {
                // Update index
                this.removeMedicineFromIndex(medicineId);
                this.addMedicineToIndex(medicine);
            }

            console.log(`✅ Synced medicine: ${medicineId}`);
        } catch (error) {
            console.error(`❌ Failed to sync medicine ${medicineId}:`, error);
        }
    }

    /**
     * Remove medicine from all indexes
     */
    removeMedicineFromIndex(medicineId) {
        const medicine = this.medicines.get(medicineId);
        if (!medicine) return;

        // Remove from main map
        this.medicines.delete(medicineId);

        // Remove from name index
        if (medicine.name) {
            const nameLower = medicine.name.toLowerCase();
            const nameSet = this.nameIndex.get(nameLower);
            if (nameSet) {
                nameSet.delete(medicineId);
                if (nameSet.size === 0) {
                    this.nameIndex.delete(nameLower);
                }
            }
        }

        // Remove from manufacturer index
        if (medicine.manufacturerName) {
            const mfgLower = medicine.manufacturerName.toLowerCase();
            const mfgSet = this.manufacturerIndex.get(mfgLower);
            if (mfgSet) {
                mfgSet.delete(medicineId);
                if (mfgSet.size === 0) {
                    this.manufacturerIndex.delete(mfgLower);
                }
            }
        }

        // Remove from composition index
        if (medicine.compositionText) {
            const compLower = medicine.compositionText.toLowerCase();
            const compSet = this.compositionIndex.get(compLower);
            if (compSet) {
                compSet.delete(medicineId);
                if (compSet.size === 0) {
                    this.compositionIndex.delete(compLower);
                }
            }
        }

        // Remove from barcode index
        if (medicine.primaryBarcode) {
            this.barcodeIndex.delete(medicine.primaryBarcode);
        }

        this.medicineCount--;
    }

    /**
     * Start background sync (checks for changes every 5 minutes)
     */
    startBackgroundSync() {
        console.log('🔄 Background sync started (checks every 5 minutes)');

        setInterval(async () => {
            try {
                console.log('🔄 Running background sync check...');

                // Check if there are new medicines
                const count = await prisma.medicineMaster.count({
                    where: { status: { not: 'DISCONTINUED' } }
                });

                if (count !== this.medicineCount) {
                    console.log(`📊 Medicine count changed: ${this.medicineCount} -> ${count}. Reloading...`);
                    await this.loadAllMedicines();
                } else {
                    console.log(`✅ Background sync: No changes detected (${count} medicines)`);
                }
            } catch (error) {
                console.error('❌ Background sync failed:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Force reload
     */
    async reload() {
        console.log('🔄 Force reloading medicines...');
        await this.loadAllMedicines();
    }
}

// Export singleton instance
module.exports = {
    InMemorySearchService,
    inMemorySearchService: new InMemorySearchService(),
};
