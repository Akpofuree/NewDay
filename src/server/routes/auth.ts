import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { makeId, query } from "../db";
import { AppError } from "../errors";
import { sanitizeValue } from "../sanitize";
import {
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signSession,
} from "../middleware/auth";
import { authRateLimit } from "../middleware/security";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/emailService";
import { verifyGoogleIdToken } from "../services/oauth";

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
  created_at?: string;
};

const googleLoginSchema = z.object({
  idToken: z.string().min(10),
});

const localSignupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
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
  password: z.string().min(8).max(200),
});

const verifyEmailSchema = z.object({
  token: z.string().min(20),
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
      "SELECT id, name, email, avatar_url, created_at FROM users WHERE email = $1",
      [profile.email],
    );

    const user =
      existing.rows[0] ||
      (
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

    await query(
      "UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = $1",
      [user.id],
    );

    await issueSessionForUser(res, user);
    res.json({ user: userResponse(user) });
  } catch (error) {
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
    const user = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (user.rowCount) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await query(
        `UPDATE users
         SET reset_password_token_hash = $1, reset_password_expires_at = $2
         WHERE email = $3`,
        [tokenHash, expiresAt, email.toLowerCase()],
      );
      await sendPasswordResetEmail(
        email,
        `${config.appUrl}/reset-password?token=${token}`,
      );
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
    const user = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    if (user.rowCount) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await query(
        `UPDATE users
         SET reset_password_token_hash = $1, reset_password_expires_at = $2
         WHERE email = $3`,
        [tokenHash, expiresAt, email.toLowerCase()],
      );
      await sendPasswordResetEmail(
        email,
        `${config.appUrl}/reset-password?token=${token}`,
      );
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
    const passwordHash = await bcrypt.hash(body.password, 12);
    const verificationToken = randomBytes(32).toString("hex");
    const verificationHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const user = await query<UserRow>(
      `INSERT INTO users (
         id, name, email, avatar_url, oauth_provider, password_hash,
         email_verification_token_hash, email_verification_expires_at
       )
       VALUES ($1, $2, $3, $4, 'local', $5, $6, NOW() + INTERVAL '24 hours')
       RETURNING id, name, email, avatar_url, created_at`,
      [
        makeId(),
        body.name,
        body.email.toLowerCase(),
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name)}`,
        passwordHash,
        verificationHash,
      ],
    );
    await sendVerificationEmail(
      body.email.toLowerCase(),
      `${config.appUrl}/verify-email?token=${verificationToken}`,
    );
    res.status(202).json({
      success: true,
      requiresVerification: true,
      user: userResponse(user.rows[0]),
      message: "Check your email to verify your account before signing in.",
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
    const result = await query<UserRow>(
      "SELECT id, name, email, avatar_url, password_hash, email_verified_at, created_at FROM users WHERE email = $1",
      [body.email.toLowerCase()],
    );
    const user = result.rows[0];
    const isValid =
      user?.password_hash &&
      (await bcrypt.compare(body.password, user.password_hash));
    if (!isValid) {
      throw new AppError(
        401,
        "Invalid email or password.",
        "INVALID_CREDENTIALS",
      );
    }
    if (!(user as any).email_verified_at) {
      throw new AppError(
        403,
        "Verify your email before signing in.",
        "EMAIL_NOT_VERIFIED",
      );
    }
    await issueSessionForUser(res, user);
    res.json({ user: userResponse(user) });
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

    await issueSessionForUser(res, result.rows[0]);
    res.json({ user: userResponse(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});
