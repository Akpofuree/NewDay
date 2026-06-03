import { Resend } from "resend";
import { config } from "../config";
import { logger } from "../logger";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) {
    logger.warn(
      "Resend is not configured; password reset link generated but not emailed.",
      {
        email,
        resetUrl,
      },
    );
    return;
  }

  try {
    await resend.emails.send({
      from: config.smtp.from || "NewDay <no-reply@newday.local>",
      to: email,
      subject: "Reset your NewDay password",
      html: `<p>Reset your NewDay password within 30 minutes:</p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  } catch (error) {
    logger.error("Failed to send password reset email via Resend", {
      error,
      email,
    });
    throw error;
  }
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  if (!resend) {
    logger.warn(
      "Resend is not configured; email verification link generated but not emailed.",
      {
        email,
        verifyUrl,
      },
    );
    return;
  }

  try {
    await resend.emails.send({
      from: config.smtp.from || "NewDay <no-reply@newday.local>",
      to: email,
      subject: "Verify your NewDay email",
      html: `<p>Verify your NewDay email within 24 hours:</p><p><a href="${verifyUrl}">Verify email</a></p>`,
    });
  } catch (error) {
    logger.error("Failed to send verification email via Resend", {
      error,
      email,
    });
    throw error;
  }
}
