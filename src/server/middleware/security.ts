import type { RequestHandler } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config, isProduction } from "../config";
import { AppError } from "../errors";

const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const allowedOrigins = new Set(config.allowedOrigins);

export const securityMiddleware: RequestHandler[] = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
        ],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
      },
    },
  }),
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        (!isProduction && localhostOriginPattern.test(origin))
      ) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, "Origin is not allowed.", "CORS_FORBIDDEN"));
    },
    credentials: true,
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait and try again." },
  }),
];

export const authRateLimit = rateLimit({
  // In production we keep a tighter limit to prevent abuse, but only count
  // requests that are likely auth attempts or failures.
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 60 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many auth attempts. Please wait and try again." },
});
