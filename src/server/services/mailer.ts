import nodemailer from "nodemailer";

const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
const secure = String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || "false") === "true";
const user = (process.env.EMAIL_USER || process.env.GMAIL_USER || "").trim();
const pass = (process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

export const mailConfig = { host, port, secure, user: user || undefined };

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user && pass ? { user, pass } : undefined,
});

async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log("[Email] SMTP connection ready", { host, port, secure, user: Boolean(user) });
  } catch (error) {
    console.error("[Email] SMTP connection failed", {
      host,
      port,
      secure,
      userConfigured: Boolean(user),
      passConfigured: Boolean(pass),
      userLength: user.length,
      passLength: pass.length,
      error,
    });
  }
}

verifyTransporter();

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const fromAddress = user || process.env.GMAIL_USER || process.env.EMAIL_FROM || "no-reply@newday.local";
  try {
    const result = await transporter.sendMail({
      from: `"NewDay" <${fromAddress}>`,
      to,
      subject,
      html,
      text: text ?? "",
    });
    console.log("[Email] Sent to", to, "| MessageId:", result.messageId);
    return { success: true };
  } catch (error) {
    console.error("[Email] sendMail failed", {
      to,
      subject,
      host,
      port,
      secure,
      userConfigured: Boolean(user),
      passConfigured: Boolean(pass),
      error,
    });
    throw error;
  }
}
