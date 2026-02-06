import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from './auth-middleware';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.AZURE_AD_TENANT_ID;
    delete process.env.AZURE_AD_CLIENT_ID;
  });

  describe('authenticateToken', () => {
    describe('dev mode (no Azure AD config)', () => {
      it('should pass through with default dev user when Azure AD is not configured', async () => {
        await authenticateToken(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.user).toBeDefined();
        expect(mockRequest.user!.oid).toBe('dev-user-id');
        expect(mockRequest.user!.email).toBe('dev@localhost');
        expect(mockRequest.user!.name).toBe('Dev User');
        expect(mockRequest.user!.roles).toContain('admin');
      });
    });

    describe('with Azure AD configured', () => {
      beforeEach(() => {
        process.env.AZURE_AD_TENANT_ID = 'test-tenant-id';
        process.env.AZURE_AD_CLIENT_ID = 'test-client-id';
      });

      it('should return 401 when no Authorization header is present', async () => {
        await authenticateToken(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Unauthorized',
            message: 'No authorization header provided',
          })
        );
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should return 401 for invalid token format (no Bearer prefix)', async () => {
        mockRequest.headers = { authorization: 'Basic some-token' };

        await authenticateToken(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Unauthorized',
            message: 'Invalid authorization format. Expected: Bearer <token>',
          })
        );
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should return 401 when Bearer token is empty', async () => {
        mockRequest.headers = { authorization: 'Bearer ' };

        await authenticateToken(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
      });

      it('should extract user info from a valid JWT payload', async () => {
        const payload = {
          oid: 'user-object-id',
          email: 'user@example.com',
          name: 'Test User',
          roles: ['reader', 'editor'],
        };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const fakeToken = `header.${encodedPayload}.signature`;

        mockRequest.headers = { authorization: `Bearer ${fakeToken}` };

        await authenticateToken(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
        expect(mockRequest.user).toEqual({
          oid: 'user-object-id',
          email: 'user@example.com',
          name: 'Test User',
          roles: ['reader', 'editor'],
        });
      });

      it('should return 401 for a malformed token', async () => {
        mockRequest.headers = { authorization: 'Bearer not-a-valid-jwt' };

        await authenticateToken(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
      });
    });
  });

  describe('requireRole', () => {
    it('should return 401 when no user is present on request', () => {
      const middleware = requireRole('admin');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Authentication required',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have the required role', () => {
      mockRequest.user = {
        oid: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        roles: ['reader'],
      };

      const middleware = requireRole('admin');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: "Required role 'admin' not found",
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should pass when user has the required role', () => {
      mockRequest.user = {
        oid: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        roles: ['admin', 'reader'],
      };

      const middleware = requireRole('admin');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
