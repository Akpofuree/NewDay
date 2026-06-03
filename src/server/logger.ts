import winston from 'winston';
import { config, isProduction } from './config';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'newday-api', environment: config.nodeEnv },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: !isProduction }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export function alertCritical(message: string, meta?: Record<string, unknown>) {
  logger.error(message, { ...meta, alert: true });
  if (config.criticalAlertWebhookUrl) {
    fetch(config.criticalAlertWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        service: 'newday-api',
        environment: config.nodeEnv,
        meta,
      }),
    }).catch(error => {
      logger.error('Critical alert webhook failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }
}
