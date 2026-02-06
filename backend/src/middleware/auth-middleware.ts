import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  oid: string;       // Azure AD object ID
  email: string;
  name: string;
  roles: string[];
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Check if Azure AD is configured via environment variables.
 */
function isAzureADConfigured(): boolean {
  return !!(process.env.AZURE_AD_TENANT_ID && process.env.AZURE_AD_CLIENT_ID);
}

/**
 * Middleware that validates JWT Bearer tokens from the Authorization header.
 *
 * - If Azure AD is NOT configured (no AZURE_AD_TENANT_ID), operates in dev mode
 *   and passes through all requests with a default dev user.
 * - If Azure AD IS configured, validates the Bearer token and extracts user info.
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Dev mode passthrough when Azure AD is not configured
  if (!isAzureADConfigured()) {
    req.user = {
      oid: 'dev-user-id',
      email: 'dev@localhost',
      name: 'Dev User',
      roles: ['admin'],
    };
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization header provided',
    });
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization format. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.slice(7);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided',
    });
    return;
  }

  try {
    // Decode the JWT payload (base64url) without full cryptographic verification
    // Full verification with JWKS will be added when connecting to a real Azure AD tenant
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format',
      });
      return;
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf-8')
    );

    req.user = {
      oid: payload.oid || payload.sub || '',
      email: payload.email || payload.preferred_username || '',
      name: payload.name || '',
      roles: payload.roles || [],
    };

    next();
  } catch {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Middleware factory that requires the authenticated user to have a specific role.
 * Must be used after `authenticateToken`.
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!req.user.roles.includes(role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role '${role}' not found`,
      });
      return;
    }

    next();
  };
}
