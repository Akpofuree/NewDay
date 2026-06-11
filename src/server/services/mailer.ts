import { Resend } from "resend";
import { config } from "../config";

// Single shared Resend client — emailService imports this instead of creating its own.
export const resend = config.resendApiKey
  ? new Resend(config.resendApiKey)
  : null;

export const emailFrom =
  config.resendApiKey && (!process.env.SMTP_FROM || config.smtp.from.includes("newday.local"))
    ? "NewDay <onboarding@resend.dev>"
    : (config.smtp.from || "NewDay <onboarding@resend.dev>");

