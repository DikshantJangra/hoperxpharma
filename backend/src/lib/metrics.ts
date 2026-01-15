/**
 * Metrics Collection for Monitoring
 * 
 * Collects performance and business metrics for observability
 */

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 10000;

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>) {
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
  increment(name: string, tags?: Record<string, string>) {
    this.record(name, 1, tags);
  }

  /**
   * Record timing
   */
  timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record(`${name}.duration`, duration, tags);
  }

  /**
   * Get metrics for a time window
   */
  getMetrics(since: Date): Metric[] {
    return this.metrics.filter((m) => m.timestamp >= since);
  }

  /**
   * Get aggregated metrics
   */
  getAggregated(name: string, since: Date): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } {
    const filtered = this.metrics.filter(
      (m) => m.name === name && m.timestamp >= since
    );

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
  cleanup(olderThan: Date) {
    this.metrics = this.metrics.filter((m) => m.timestamp >= olderThan);
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// Cleanup old metrics every hour
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  metrics.cleanup(oneHourAgo);
}, 60 * 60 * 1000);

// Medicine-specific metrics
export const medicineMetrics = {
  searchPerformed: (duration: number, resultCount: number) => {
    metrics.timing('medicine.search', duration);
    metrics.record('medicine.search.results', resultCount);
  },

  medicineCreated: (source: string) => {
    metrics.increment('medicine.created', { source });
  },

  medicineUpdated: () => {
    metrics.increment('medicine.updated');
  },

  overlaySet: (storeId: string) => {
    metrics.increment('medicine.overlay.set', { storeId });
  },

  ingestionSubmitted: (source: string, confidence: number) => {
    metrics.increment('medicine.ingestion.submitted', { source });
    metrics.record('medicine.ingestion.confidence', confidence, { source });
  },

  imageUploaded: (size: number, isDuplicate: boolean) => {
    metrics.increment('medicine.image.uploaded', {
      duplicate: isDuplicate.toString(),
    });
    metrics.record('medicine.image.size', size);
  },

  migrationProgress: (processed: number, total: number) => {
    metrics.record('medicine.migration.progress', (processed / total) * 100);
  },

  recordMedicineOperation: (operation: string, duration: number) => {
    metrics.timing(`medicine.operation.${operation}`, duration);
  },

  incrementMedicineCount: () => {
    metrics.increment('medicine.total_count');
  },
};

export default metrics;
