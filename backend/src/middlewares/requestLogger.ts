/**
 * Request Logger Middleware
 * 
 * Logs all API requests with timing and context
 */

import { Request, Response, NextFunction } from 'express';
import { logApiRequest } from '../lib/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logApiRequest(req.method, req.path, res.statusCode, duration);
  });

  next();
};
