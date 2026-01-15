"use strict";
/**
 * Metrics Collection for Monitoring
 *
 * Collects performance and business metrics for observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicineMetrics = exports.metrics = void 0;
class MetricsCollector {
    constructor() {
        this.metrics = [];
        this.maxMetrics = 10000;
    }
    /**
     * Record a metric
     */
    record(name, value, tags) {
        this.metrics.push({
            name,
            value,
            timestamp: new Date(),
            tags,
        });
        // Prevent memory leak
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }
    /**
     * Increment a counter
     */
    increment(name, tags) {
        this.record(name, 1, tags);
    }
    /**
     * Record timing
     */
    timing(name, duration, tags) {
        this.record(`${name}.duration`, duration, tags);
    }
    /**
     * Get metrics for a time window
     */
    getMetrics(since) {
        return this.metrics.filter((m) => m.timestamp >= since);
    }
    /**
     * Get aggregated metrics
     */
    getAggregated(name, since) {
        const filtered = this.metrics.filter((m) => m.name === name && m.timestamp >= since);
        if (filtered.length === 0) {
            return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
        }
        const values = filtered.map((m) => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            count: filtered.length,
            sum,
            avg: sum / filtered.length,
            min: Math.min(...values),
            max: Math.max(...values),
        };
    }
    /**
     * Clear old metrics
     */
    cleanup(olderThan) {
        this.metrics = this.metrics.filter((m) => m.timestamp >= olderThan);
    }
}
// Singleton instance
exports.metrics = new MetricsCollector();
// Cleanup old metrics every hour
setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    exports.metrics.cleanup(oneHourAgo);
}, 60 * 60 * 1000);
// Medicine-specific metrics
exports.medicineMetrics = {
    searchPerformed: (duration, resultCount) => {
        exports.metrics.timing('medicine.search', duration);
        exports.metrics.record('medicine.search.results', resultCount);
    },
    medicineCreated: (source) => {
        exports.metrics.increment('medicine.created', { source });
    },
    medicineUpdated: () => {
        exports.metrics.increment('medicine.updated');
    },
    overlaySet: (storeId) => {
        exports.metrics.increment('medicine.overlay.set', { storeId });
    },
    ingestionSubmitted: (source, confidence) => {
        exports.metrics.increment('medicine.ingestion.submitted', { source });
        exports.metrics.record('medicine.ingestion.confidence', confidence, { source });
    },
    imageUploaded: (size, isDuplicate) => {
        exports.metrics.increment('medicine.image.uploaded', {
            duplicate: isDuplicate.toString(),
        });
        exports.metrics.record('medicine.image.size', size);
    },
    migrationProgress: (processed, total) => {
        exports.metrics.record('medicine.migration.progress', (processed / total) * 100);
    },
    recordMedicineOperation: (operation, duration) => {
        exports.metrics.timing(`medicine.operation.${operation}`, duration);
    },
    incrementMedicineCount: () => {
        exports.metrics.increment('medicine.total_count');
    },
};
exports.default = exports.metrics;
