import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../logger';

const hasSmtp = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!hasSmtp) {
    logger.warn('SMTP is not configured; password reset link generated but not emailed.', {
      email,
      resetUrl,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Reset your NewDay password',
    text: `Reset your password within 30 minutes: ${resetUrl}`,
    html: `<p>Reset your NewDay password within 30 minutes:</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  if (!hasSmtp) {
    logger.warn('SMTP is not configured; email verification link generated but not emailed.', {
      email,
      verifyUrl,
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Verify your NewDay email',
    text: `Verify your email within 24 hours: ${verifyUrl}`,
    html: `<p>Verify your NewDay email within 24 hours:</p><p><a href="${verifyUrl}">Verify email</a></p>`,
  });
}
