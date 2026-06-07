import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { makeId, query } from "../db";
import { AppError } from "../errors";
import { logger } from "../logger";
import { sanitizeValue } from "../sanitize";
import {
  clearSessionCookie,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  signSession,
} from "../middleware/auth";
import { authRateLimit } from "../middleware/security";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/emailService";
import { verifyGoogleIdToken } from "../services/oauth";
import { validatePassword } from "../utils/passwordValidator";

export const authRouter = Router();

type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio?: string | null;
  timezone?: string | null;
  notification_preferences?: Record<string, boolean> | null;
  password_hash?: string | null;
  oauth_provider?: string;
  oauth_provider_id?: string | null;
  email_verified_at?: string | null;
  failed_login_attempts?: number;
  locked_until?: string | null;
  permanently_locked?: boolean;
  created_at?: string;
};

const googleLoginSchema = z.object({
  idToken: z.string().min(10),
});

const localSignupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

const localLoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

const resetRequestSchema = z.object({
  email: z.string().email().max(255),
});

const consumeResetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(1).max(200),
});

const verifyEmailSchema = z.object({
  token: z.string().min(20),
});

const unlockSchema = z.object({
  email: z.string().email().max(255),
});

function userResponse(row: {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string | null;
  notification_preferences?: Record<string, boolean> | null;
  created_at?: string;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl:
      row.avatar_url ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.name)}`,
    bio: row.bio || "",
    timezone:
      row.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    notificationPreferences: row.notification_preferences || {
      email: true,
      mentions: true,
      tasks: true,
    },
    createdAt: row.created_at,
  };
}

async function issueSessionForUser(
  res: Parameters<typeof setSessionCookie>[0],
  user: { id: string; email: string; name: string },
) {
  const token = signSession(user);
  setSessionCookie(res, token);
}

function lockoutMinutesRemaining(lockedUntil: string) {
  const remainingMs = new Date(lockedUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60_000));
}

function lockoutSecondsRemaining(lockedUntil: string) {
  const remainingMs = new Date(lockedUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await query<UserRow>(
    "SELECT id, name, email, avatar_url, bio, timezone, notification_preferences, created_at FROM users WHERE id = $1",
    [req.user!.id],
  );
  res.json({ user: user.rows[0] ? userResponse(user.rows[0]) : req.user });
});

authRouter.get("/providers", (_req, res) => {
  res.json({
    google: {
      enabled: Boolean(config.googleClientId),
      clientId: config.googleClientId || null,
    },
  });
});

authRouter.post("/google", authRateLimit, async (req, res, next) => {
  try {
    const { idToken } = googleLoginSchema.parse(sanitizeValue(req.body));
    const profile = await verifyGoogleIdToken(idToken);

    const existing = await query<UserRow>(
      `SELECT id, name, email, avatar_url, password_hash, oauth_provider, oauth_provider_id, created_at
       FROM users WHERE email = $1`,
      [profile.email],
    );

    let user: UserRow;

    if (existing.rows[0]) {
      const row = existing.rows[0];

      // Password-registered account with the same email — do not create a duplicate.
      if (row.oauth_provider === "local" && row.password_hash) {
        throw new AppError(
          409,
          "An account with this email already exists. Please sign in with your email and password.",
          "EMAIL_EXISTS_PASSWORD",
        );
      }

      // Link Google to an existing OAuth-only account or refresh provider metadata.
      const linked = await query<UserRow>(
        `UPDATE users
         SET oauth_provider = 'google',
             oauth_provider_id = $1,
             avatar_url = COALESCE(avatar_url, $2),
             name = COALESCE(NULLIF(name, ''), $3)
         WHERE id = $4
         RETURNING id, name, email, avatar_url, created_at`,
        [profile.providerId, profile.avatarUrl, profile.name, row.id],
      );
      user = linked.rows[0];
    } else {
      user = (
        await query<UserRow>(
          `INSERT INTO users (id, name, email, avatar_url, oauth_provider, oauth_provider_id)
           VALUES ($1, $2, $3, $4, 'google', $5)
           RETURNING id, name, email, avatar_url, created_at`,
          [
            makeId(),
            profile.name,
            profile.email,
            profile.avatarUrl,
            profile.providerId,
          ],
        )
      ).rows[0];
    }

    await query(
      "UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $1",
      [user.id],
    );

    await issueSessionForUser(res, user);
    res.json({ user: userResponse(user) });
  } catch (error: any) {
    if (error?.code === "23505") {
      next(
        new AppError(
          409,
          "An account with this email already exists. Please sign in with your email and password.",
          "EMAIL_EXISTS",
        ),
      );
      return;
    }
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

authRouter.post("/reset-password", authRateLimit, async (req, res, next) => {
  try {
    const { email } = resetRequestSchema.parse(sanitizeValue(req.body));
    const normalizedEmail = email.toLowerCase();
    const user = await query<{ id: string; name: string }>(
      "SELECT id, name FROM users WHERE email = $1",
      [normalizedEmail],
    );

    if (user.rowCount) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await query(
        `UPDATE users
         SET reset_password_token_hash = $1, reset_password_expires_at = $2
         WHERE email = $3`,
        [tokenHash, expiresAt, normalizedEmail],
      );
      await sendPasswordResetEmail(normalizedEmail, token, user.rows[0].name);
    }

    res.json({
      success: true,
      message: "If that email exists, a reset link will be sent.",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset", authRateLimit, async (req, res, next) => {
  try {
    const { email } = resetRequestSchema.parse(sanitizeValue(req.body));
    const normalizedEmail = email.toLowerCase();
    const user = await query<{ id: string; name: string }>(
      "SELECT id, name FROM users WHERE email = $1",
      [normalizedEmail],
    );

    if (user.rowCount) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await query(
        `UPDATE users
         SET reset_password_token_hash = $1, reset_password_expires_at = $2
         WHERE email = $3`,
        [tokenHash, expiresAt, normalizedEmail],
      );
      await sendPasswordResetEmail(normalizedEmail, token, user.rows[0].name);
    }

    res.json({
      success: true,
      message: "If that email exists, a reset link will be sent.",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password/confirm", async (req, res, next) => {
  try {
    const { token, password } = consumeResetSchema.parse(
      sanitizeValue(req.body),
    );

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({
        error: "Password does not meet requirements.",
        code: "WEAK_PASSWORD",
        errors: passwordCheck.errors,
      });
      return;
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `UPDATE users
       SET password_hash = $1, reset_password_token_hash = NULL, reset_password_expires_at = NULL
       WHERE reset_password_token_hash = $2 AND reset_password_expires_at > NOW()
       RETURNING id`,
      [passwordHash, tokenHash],
    );

    if (!result.rowCount) {
      throw new AppError(
        400,
        "Reset link is invalid or expired.",
        "RESET_TOKEN_INVALID",
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/signup", authRateLimit, async (req, res, next) => {
  try {
    const body = localSignupSchema.parse(sanitizeValue(req.body));

    const passwordCheck = validatePassword(body.password);
    if (!passwordCheck.valid) {
      res.status(400).json({
        error: "Password does not meet requirements.",
        code: "WEAK_PASSWORD",
        errors: passwordCheck.errors,
      });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await query<UserRow>(
      `INSERT INTO users (
         id, name, email, avatar_url, oauth_provider, password_hash,
         email_verified_at
       )
       VALUES ($1, $2, $3, $4, 'local', $5, NOW())
       RETURNING id, name, email, avatar_url, created_at`,
      [
        makeId(),
        body.name,
        body.email.toLowerCase(),
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name)}`,
        passwordHash,
      ],
    );
    await issueSessionForUser(res, user.rows[0]);
    res.json({
      success: true,
      user: userResponse(user.rows[0]),
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      next(
        new AppError(
          409,
          "An account with this email already exists.",
          "EMAIL_EXISTS",
        ),
      );
      return;
    }
    next(error);
  }
});

authRouter.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const body = localLoginSchema.parse(sanitizeValue(req.body));
    const normalizedEmail = body.email.toLowerCase();
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";

    const result = await query<UserRow>(
      `SELECT id, name, email, avatar_url, password_hash, email_verified_at, created_at,
              failed_login_attempts, locked_until, permanently_locked
       FROM users WHERE email = $1`,
      [normalizedEmail],
    );
    const user = result.rows[0];

    if (user) {
      if (user.permanently_locked) {
        logger.warn("Failed login attempt", {
          email: normalizedEmail,
          ip: clientIp,
          timestamp: new Date().toISOString(),
          reason: "account_locked",
          lockType: "permanent",
        });
        throw new AppError(
          403,
          "Account permanently locked — contact support",
          "ACCOUNT_PERMANENTLY_LOCKED",
        );
      }

      if (user.locked_until) {
        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil.getTime() > Date.now()) {
          const minutes = lockoutMinutesRemaining(user.locked_until);
          const retryAfterSeconds = lockoutSecondsRemaining(user.locked_until);
          logger.warn("Failed login attempt", {
            email: normalizedEmail,
            ip: clientIp,
            timestamp: new Date().toISOString(),
            reason: "account_locked",
            lockType: "temporary",
          });
          res.status(429).json({
            error: `Account locked — try again in ${minutes} minutes`,
            code: "ACCOUNT_TEMPORARILY_LOCKED",
            retryAfterSeconds,
          });
          return;
        }

        // Lock expired — allow another attempt and reset counters.
        await query(
          `UPDATE users
           SET failed_login_attempts = 0, locked_until = NULL
           WHERE id = $1`,
          [user.id],
        );
        user.failed_login_attempts = 0;
        user.locked_until = null;
      }
    }

    const isValid =
      user?.password_hash &&
      (await bcrypt.compare(body.password, user.password_hash));

    if (!isValid) {
      const reason = user ? "wrong_password" : "account_not_found";

      logger.warn("Failed login attempt", {
        email: normalizedEmail,
        ip: clientIp,
        timestamp: new Date().toISOString(),
        reason,
      });

      if (user) {
        const nextAttempts = (user.failed_login_attempts || 0) + 1;

        if (nextAttempts >= 15) {
          await query(
            `UPDATE users
             SET failed_login_attempts = $1, permanently_locked = true, locked_until = NULL
             WHERE id = $2`,
            [nextAttempts, user.id],
          );
          logger.warn(
            "Account permanently locked after failed login attempts",
            {
              email: normalizedEmail,
              ip: clientIp,
              timestamp: new Date().toISOString(),
              lockType: "permanent",
              failedAttempts: nextAttempts,
            },
          );
          throw new AppError(
            403,
            "Account permanently locked — contact support",
            "ACCOUNT_PERMANENTLY_LOCKED",
          );
        }

        if (nextAttempts % 5 === 0) {
          await query(
            `UPDATE users
             SET failed_login_attempts = $1, locked_until = NOW() + INTERVAL '15 minutes'
             WHERE id = $2`,
            [nextAttempts, user.id],
          );
          logger.warn(
            "Account temporarily locked after failed login attempts",
            {
              email: normalizedEmail,
              ip: clientIp,
              timestamp: new Date().toISOString(),
              lockType: "temporary",
              failedAttempts: nextAttempts,
            },
          );
          res.status(429).json({
            error: "Account locked — try again in 15 minutes",
            code: "ACCOUNT_TEMPORARILY_LOCKED",
            retryAfterSeconds: 15 * 60,
          });
          return;
        }

        await query(
          "UPDATE users SET failed_login_attempts = $1 WHERE id = $2",
          [nextAttempts, user.id],
        );
      }

      throw new AppError(
        401,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    await query(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL
       WHERE id = $1`,
      [user.id],
    );

    await issueSessionForUser(res, user);
    res.json({ user: userResponse(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/unlock", requireAdmin, async (req, res, next) => {
  try {
    const { email } = unlockSchema.parse(sanitizeValue(req.body));
    const normalizedEmail = email.toLowerCase();

    const result = await query(
      `UPDATE users
       SET permanently_locked = false,
           failed_login_attempts = 0,
           locked_until = NULL
       WHERE email = $1
       RETURNING id`,
      [normalizedEmail],
    );

    if (!result.rowCount) {
      throw new AppError(404, "User not found.", "USER_NOT_FOUND");
    }

    logger.info("Account unlocked by admin", {
      targetEmail: normalizedEmail,
      adminUserId: req.user!.id,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: "Account unlocked successfully" });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/verify-email", authRateLimit, async (req, res, next) => {
  try {
    const { token } = verifyEmailSchema.parse(sanitizeValue(req.body));
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const result = await query<UserRow>(
      `UPDATE users
       SET email_verified_at = NOW(),
           email_verification_token_hash = NULL,
           email_verification_expires_at = NULL
       WHERE email_verification_token_hash = $1
         AND email_verification_expires_at > NOW()
       RETURNING id, name, email, avatar_url, created_at`,
      [tokenHash],
    );

    if (!result.rowCount) {
      throw new AppError(
        400,
        "Verification link is invalid or expired.",
        "VERIFY_TOKEN_INVALID",
      );
    }

    const verifiedUser = result.rows[0];
    await sendWelcomeEmail(verifiedUser.email, verifiedUser.name);
    await issueSessionForUser(res, verifiedUser);
    res.json({ user: userResponse(verifiedUser) });
  } catch (error) {
    next(error);
  }
});
