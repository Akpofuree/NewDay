import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { authRouter } from "./routes/auth";
import { tasksRouter } from "./routes/tasks";
import { workspaceRouter } from "./routes/workspace";
import { aiRouter } from "./routes/ai";
import { securityMiddleware } from "./middleware/security";
import { errorHandler, notFoundHandler } from "./errors";
import { config, isProduction } from "./config";
import { devMemoryRouter } from "./routes/devMemory";

export async function createApp(options?: { serveFrontend?: boolean }) {
  const serveFrontend = options?.serveFrontend ?? !isProduction;
  const app = express();

  app.set("trust proxy", 1);

  // Serve static files BEFORE security middleware to avoid 403 errors
  if (serveFrontend && isProduction) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
  }

  app.use(securityMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  if (!serveFrontend) {
    app.get("/", (_req, res) => {
      res.json({ message: "NewDay API is running 🚀" });
    });
  }
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  if (!config.databaseUrl && !isProduction) {
    app.use("/api", devMemoryRouter);
    app.use("/", devMemoryRouter);
  } else {
    app.use("/auth", authRouter);
    app.use("/api/auth", authRouter);
    app.use("/tasks", tasksRouter);
    app.use("/api/tasks", tasksRouter);
    app.use("/api/ai", aiRouter);
    app.use("/api", workspaceRouter);
  }

  if (serveFrontend) {
    if (!isProduction) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      // Static files already served above before security middleware
      app.get("*", (_req, res) => {
        const distPath = path.join(process.cwd(), "dist");
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
