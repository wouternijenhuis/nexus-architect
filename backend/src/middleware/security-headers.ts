import helmet from 'helmet'
import type { Request, Response, NextFunction } from 'express'

/**
 * Security headers middleware using helmet with configured CSP and HSTS.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: [
        "'self'",
        'ws:',
        'wss:',
        '*.openai.azure.com',
        '*.cognitiveservices.azure.com',
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
})

/**
 * HTTPS redirect middleware — only active in production.
 * Redirects HTTP requests to HTTPS.
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV !== 'production') {
    next()
    return
  }

  // Check x-forwarded-proto header (common behind load balancers/proxies)
  const proto = req.headers['x-forwarded-proto'] || req.protocol
  if (proto === 'http') {
    res.redirect(301, `https://${req.headers.host}${req.url}`)
    return
  }

  next()
}
