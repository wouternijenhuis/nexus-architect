import rateLimit from 'express-rate-limit';

/**
 * General API rate limit
 * Applies to all API routes
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 15
  }
});

/**
 * AI generation rate limit (stricter)
 * Applies to AI-related endpoints
 * 10 requests per hour per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI Rate Limit Exceeded',
    message: 'You have exceeded the AI generation limit. Please try again later.',
    retryAfter: 60
  }
});

/**
 * Resource modification rate limit
 * Applies to POST/PUT/DELETE operations
 * 50 requests per 15 minutes per IP
 */
export const modificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Modification Rate Limit Exceeded',
    message: 'You have exceeded the modification rate limit. Please try again later.',
    retryAfter: 15
  }
});
