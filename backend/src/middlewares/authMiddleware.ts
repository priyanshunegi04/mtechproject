import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { InstitutionalRole } from '../types';

export interface AuthenticatedUserPayload {
  id?: string;
  userId: string;
  email: string;
  name: string;
  role: InstitutionalRole;
  rollNumber?: string;
  personaKey?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export function signAccessToken(payload: AuthenticatedUserPayload, secret: string, expiresIn = '2h'): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: AuthenticatedUserPayload, secret: string, expiresIn = '7d'): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function requireAuth(jwtAccessSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : (req.cookies?.tiet_access_token as string | undefined);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Provide a valid Bearer JWT access token.',
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtAccessSecret) as AuthenticatedUserPayload;
      req.user = {
        ...decoded,
        id: decoded.id || decoded.userId,
        userId: decoded.userId || decoded.id || '',
      };
      next();
    } catch (_err) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired JWT access token.',
      });
    }
  };
}

export function requireRole(allowedRoles: InstitutionalRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Insufficient institutional privileges. Required role(s): ${allowedRoles.join(', ')} (Current role: ${req.user.role}).`,
      });
      return;
    }

    next();
  };
}

