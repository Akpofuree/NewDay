import { config } from "../config";
import { logger } from "../logger";
import { emailFrom, resend } from "./mailer";

function emailShell(title: string, body: string, ctaLabel: string, ctaUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      <h1 style="font-size: 22px; margin-bottom: 8px;">${title}</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">${body}</p>
      <p style="margin: 28px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background: #5C27FE; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">
          ${ctaLabel}
        </a>
      </p>
      <p style="font-size: 12px; color: #94a3b8;">If the button does not work, copy and paste this link into your browser:<br><a href="${ctaUrl}">${ctaUrl}</a></p>
    </div>
  `;
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string,
): Promise<void> {
  const verifyUrl = `${config.appUrl}/verify-email?token=${token}`;

  if (!resend) {
    logger.warn(
      "Resend is not configured; email verification link generated but not emailed.",
      { email: to, verifyUrl },
    );
    return;
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: "Verify your NewDay email",
      html: emailShell(
        `Welcome, ${name}`,
        "Thanks for signing up for NewDay. Please verify your email address within 24 hours to activate your workspace account.",
        "Verify email",
        verifyUrl,
      ),
    });
  } catch (error) {
    // Log but do not throw — auth flow should not fail because email delivery failed.
    logger.error("Failed to send verification email via Resend", { error, email: to });
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name: string,
): Promise<void> {
  const resetUrl = `${config.appUrl}/reset-password?token=${token}`;

  if (!resend) {
    logger.warn(
      "Resend is not configured; password reset link generated but not emailed.",
      { email: to, resetUrl },
    );
    return;
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: "Reset your NewDay password",
      html: emailShell(
        `Hi ${name}`,
        "We received a request to reset your NewDay password. This link expires in 30 minutes. If you did not request a reset, you can safely ignore this email.",
        "Reset password",
        resetUrl,
      ),
    });
  } catch (error) {
    logger.error("Failed to send password reset email via Resend", { error, email: to });
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const dashboardUrl = config.appUrl;

  if (!resend) {
    logger.warn("Resend is not configured; welcome email skipped.", { email: to });
    return;
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: "Welcome to NewDay",
      html: emailShell(
        `You're all set, ${name}`,
        "Your email is verified and your NewDay workspace is ready. Start organizing tasks, collaborating with your team, and building your focus workflow.",
        "Open NewDay",
        dashboardUrl,
      ),
    });
  } catch (error) {
    logger.error("Failed to send welcome email via Resend", { error, email: to });
  }
}

export async function sendWorkspaceInviteEmail(
  to: string,
  inviterName: string,
  groupName: string,
  inviteUrl: string,
): Promise<void> {
  if (!resend) {
    logger.warn(
      "Resend is not configured; workspace invite link generated but not emailed.",
      { email: to, inviteUrl },
    );
    return;
  }

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: `${inviterName} invited you to ${groupName} on NewDay`,
      html: emailShell(
        `Join ${groupName}`,
        `${inviterName} invited you to collaborate in ${groupName} on NewDay. This invite expires in 7 days.`,
        "Accept invite",
        inviteUrl,
      ),
    });
  } catch (error) {
    logger.error("Failed to send workspace invite email via Resend", {
      error,
      email: to,
    });
  }
}
