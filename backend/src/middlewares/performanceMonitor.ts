/**
 * Performance Monitoring Middleware
 * 
 * Tracks API performance and slow queries
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import { metrics } from '../lib/metrics';

const SLOW_REQUEST_THRESHOLD = 1000; // 1 second

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memoryUsed = process.memoryUsage().heapUsed - startMemory;

    // Record metrics
    metrics.timing('api.request', duration, {
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode.toString(),
    });

    // Log slow requests
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn({
        message: 'Slow API Request',
        method: req.method,
        path: req.path,
        duration,
        memoryUsed,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

// Helper to measure function execution time
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    metrics.timing(name, duration, tags);

    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn({
        message: `Slow operation: ${name}`,
        duration,
        tags,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.timing(`${name}.error`, duration, tags);
    throw error;
  }
};
