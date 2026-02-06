import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock express-rate-limit before importing the middleware
vi.mock('express-rate-limit', () => {
  return {
    default: vi.fn((options) => {
      // Return a middleware function that tracks calls and can simulate rate limiting
      const middleware = vi.fn((req: Request, res: Response, next: NextFunction) => {
        // Simulate rate limit headers
        res.setHeader('RateLimit-Limit', options.max);
        res.setHeader('RateLimit-Remaining', options.max - 1);
        res.setHeader('RateLimit-Reset', Math.floor(Date.now() / 1000) + Math.floor(options.windowMs / 1000));
        
        // Check if we should simulate rate limit exceeded
        if ((req as any).simulateRateLimitExceeded) {
          res.status(429).json(options.message);
          return;
        }
        
        next();
      });
      
      // Attach config for testing
      (middleware as any).config = options;
      return middleware;
    })
  };
});

import { generalLimiter, aiLimiter, modificationLimiter } from './rate-limit.js';

describe('Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      headers: {}
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis()
    };
    nextFunction = vi.fn();
  });

  describe('generalLimiter', () => {
    it('should have correct configuration', () => {
      const config = (generalLimiter as any).config;
      expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.max).toBe(100);
      expect(config.standardHeaders).toBe(true);
      expect(config.legacyHeaders).toBe(false);
    });

    it('should set rate limit headers on successful request', () => {
      generalLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.setHeader).toHaveBeenCalledWith('RateLimit-Limit', 100);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('RateLimit-Remaining', expect.any(Number));
      expect(mockResponse.setHeader).toHaveBeenCalledWith('RateLimit-Reset', expect.any(Number));
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 429 with proper message when limit exceeded', () => {
      (mockRequest as any).simulateRateLimitExceeded = true;
      
      generalLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: 15
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('aiLimiter', () => {
    it('should have correct configuration for AI endpoints', () => {
      const config = (aiLimiter as any).config;
      expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(config.max).toBe(10); // Stricter limit
      expect(config.standardHeaders).toBe(true);
      expect(config.legacyHeaders).toBe(false);
    });

    it('should set rate limit headers on successful request', () => {
      aiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.setHeader).toHaveBeenCalledWith('RateLimit-Limit', 10);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('RateLimit-Remaining', expect.any(Number));
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 429 with AI-specific message when limit exceeded', () => {
      (mockRequest as any).simulateRateLimitExceeded = true;
      
      aiLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'AI Rate Limit Exceeded',
        message: 'You have exceeded the AI generation limit. Please try again later.',
        retryAfter: 60
      });
    });
  });

  describe('modificationLimiter', () => {
    it('should have correct configuration for modification endpoints', () => {
      const config = (modificationLimiter as any).config;
      expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.max).toBe(50);
      expect(config.standardHeaders).toBe(true);
      expect(config.legacyHeaders).toBe(false);
    });

    it('should set rate limit headers on successful request', () => {
      modificationLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.setHeader).toHaveBeenCalledWith('RateLimit-Limit', 50);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('RateLimit-Remaining', expect.any(Number));
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 429 with modification-specific message when limit exceeded', () => {
      (mockRequest as any).simulateRateLimitExceeded = true;
      
      modificationLimiter(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Modification Rate Limit Exceeded',
        message: 'You have exceeded the modification rate limit. Please try again later.',
        retryAfter: 15
      });
    });
  });

  describe('Rate Limit Tiers', () => {
    it('should have stricter limits for AI than general API', () => {
      const generalConfig = (generalLimiter as any).config;
      const aiConfig = (aiLimiter as any).config;
      
      // AI should have fewer allowed requests
      expect(aiConfig.max).toBeLessThan(generalConfig.max);
      // AI should have longer window
      expect(aiConfig.windowMs).toBeGreaterThan(generalConfig.windowMs);
    });

    it('should have stricter limits for modifications than general API', () => {
      const generalConfig = (generalLimiter as any).config;
      const modConfig = (modificationLimiter as any).config;
      
      // Modifications should have fewer allowed requests
      expect(modConfig.max).toBeLessThan(generalConfig.max);
    });
  });
});
