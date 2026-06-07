import dotenv from "dotenv";

dotenv.config();

const parseOrigins = (value?: string) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  appUrl: process.env.APP_URL || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  adminEmails: parseOrigins(process.env.ADMIN_EMAILS).map((email) =>
    email.toLowerCase(),
  ),
  criticalAlertWebhookUrl: process.env.CRITICAL_ALERT_WEBHOOK_URL || "",
  allowedOrigins: parseOrigins(
    process.env.ALLOWED_ORIGINS || process.env.APP_URL,
  ),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "NewDay <no-reply@newday.local>",
  },
};

export const isProduction = config.nodeEnv === "production";

export function assertRequiredConfig() {
  const missing = [];
  if (!config.databaseUrl) missing.push("DATABASE_URL");
  if (!config.jwtSecret || config.jwtSecret.length < 32)
    missing.push("JWT_SECRET (32+ chars)");
  if (!config.googleClientId) missing.push("GOOGLE_CLIENT_ID");
  if (!config.anthropicApiKey && !config.geminiApiKey)
    missing.push("GEMINI_API_KEY or ANTHROPIC_API_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
