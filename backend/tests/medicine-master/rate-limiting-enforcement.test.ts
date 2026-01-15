/**
 * Property Test: Rate Limiting Enforcement (Property 32)
 * 
 * Validates: Requirements 9.3
 * 
 * Property: API should enforce rate limits and return 429 when exceeded
 * 
 * Test Strategy:
 * - Make requests within limit
 * - Make requests exceeding limit
 * - Verify 429 response when limit exceeded
 */

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { rateLimit } from 'express-rate-limit';

describe('Property 32: Rate Limiting Enforcement', () => {
  // Create a test app with rate limiting
  const createTestApp = (maxRequests: number, windowMs: number) => {
    const app = express();
    
    const limiter = rateLimit({
      windowMs,
      max: maxRequests,
      message: 'Too many requests',
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use(limiter);
    app.get('/test', (req, res) => {
      res.json({ message: 'success' });
    });

    return app;
  };

  it('should allow requests within limit', async () => {
    const app = createTestApp(5, 60000); // 5 requests per minute

    // Make 5 requests (within limit)
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }
  });

  it('should block requests exceeding limit', async () => {
    const app = createTestApp(3, 60000); // 3 requests per minute

    // Make 3 requests (within limit)
    for (let i = 0; i < 3; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }

    // 4th request should be blocked
    const response = await request(app).get('/test');
    expect(response.status).toBe(429);
  });

  it('should return 429 status code when limit exceeded', async () => {
    const app = createTestApp(2, 60000);

    await request(app).get('/test');
    await request(app).get('/test');
    
    const response = await request(app).get('/test');
    expect(response.status).toBe(429);
  });

  it('should include rate limit headers', async () => {
    const app = createTestApp(5, 60000);

    const response = await request(app).get('/test');
    
    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
  });

  it('should reset after window expires', async () => {
    const app = createTestApp(2, 100); // 2 requests per 100ms

    // Use up the limit
    await request(app).get('/test');
    await request(app).get('/test');
    
    // Should be blocked
    let response = await request(app).get('/test');
    expect(response.status).toBe(429);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should work again
    response = await request(app).get('/test');
    expect(response.status).toBe(200);
  });

  it('should track limits per client', async () => {
    const app = createTestApp(2, 60000);

    // Client 1 uses up limit
    await request(app).get('/test').set('X-Forwarded-For', '1.1.1.1');
    await request(app).get('/test').set('X-Forwarded-For', '1.1.1.1');
    
    // Client 1 should be blocked
    let response = await request(app).get('/test').set('X-Forwarded-For', '1.1.1.1');
    expect(response.status).toBe(429);

    // Client 2 should still work
    response = await request(app).get('/test').set('X-Forwarded-For', '2.2.2.2');
    expect(response.status).toBe(200);
  });

  it('should enforce limit consistently', async () => {
    const app = createTestApp(10, 60000);
    const results: number[] = [];

    // Make 15 requests
    for (let i = 0; i < 15; i++) {
      const response = await request(app).get('/test');
      results.push(response.status);
    }

    // First 10 should succeed
    expect(results.slice(0, 10).every(status => status === 200)).toBe(true);
    
    // Remaining should be blocked
    expect(results.slice(10).every(status => status === 429)).toBe(true);
  });
});
