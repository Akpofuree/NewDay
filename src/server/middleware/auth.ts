import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config, isProduction } from '../config';
import { AppError } from '../errors';
import { query } from '../db';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const cookieName = 'newday_session';

export function signSession(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: '7d', issuer: 'newday-api' },
  );
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getAuthUserFromToken(token?: string): Promise<AuthUser | null> {
  if (!token) return null;

  const payload = jwt.verify(token, config.jwtSecret, { issuer: 'newday-api' }) as jwt.JwtPayload;
  const userId = payload.sub;
  if (!userId) return null;

  const result = await query<{ id: string; email: string; name: string; avatar_url: string | null }>(
    'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
    [userId],
  );

  if (!result.rowCount) return null;

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url || undefined,
  };
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) {
      throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    }

    const user = await getAuthUserFromToken(token);
    if (!user) {
      throw new AppError(401, 'Invalid session.', 'INVALID_SESSION');
    }

    if (!config.adminEmails.includes(user.email.toLowerCase())) {
      throw new AppError(403, 'Admin access required.', 'ADMIN_REQUIRED');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'Invalid session.', 'INVALID_SESSION'));
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) {
      throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    }

    const user = await getAuthUserFromToken(token);
    if (!user) {
      throw new AppError(401, 'Invalid session.', 'INVALID_SESSION');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'Invalid session.', 'INVALID_SESSION'));
  }
}
