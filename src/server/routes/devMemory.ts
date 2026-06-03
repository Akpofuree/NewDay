import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { defaultChannels, defaultGroups, makeId } from "../db";
import { AppError } from "../errors";
import {
  clearSessionCookie,
  setSessionCookie,
  signSession,
  type AuthUser,
} from "../middleware/auth";
import { sanitizeValue } from "../sanitize";

type DevUser = AuthUser & {
  avatarUrl: string;
  passwordHash: string;
  createdAt: string;
};

const users = new Map<string, DevUser>();
const tasks = new Map<string, any>();
const goals = new Map<string, any>();
const groups = new Map<string, any>();
const chatMessages = new Map<string, any>();

const authSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

const taskSchema = z
  .object({
    title: z.string().min(1).max(300),
  })
  .passthrough();

function requireDevAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.newday_session;
    if (!token) {
      throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
    }
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: "newday-api",
    }) as jwt.JwtPayload;
    const user = payload.sub ? users.get(payload.sub) : undefined;
    if (!user) {
      throw new AppError(401, "Invalid session.", "INVALID_SESSION");
    }
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(401, "Invalid session.", "INVALID_SESSION"),
    );
  }
}

function publicUser(user: DevUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

function currentUserTasks(userId: string) {
  return Array.from(tasks.values())
    .filter((task) => task.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export const devMemoryRouter = Router();

devMemoryRouter.get("/auth/me", requireDevAuth, (req, res) => {
  res.json({ user: req.user });
});

devMemoryRouter.post("/auth/signup", async (req, res, next) => {
  try {
    const body = authSchema.parse(sanitizeValue(req.body));
    const email = body.email.toLowerCase();
    if (Array.from(users.values()).some((user) => user.email === email)) {
      throw new AppError(
        409,
        "An account with this email already exists.",
        "EMAIL_EXISTS",
      );
    }

    const name = body.name || email.split("@")[0];
    const user: DevUser = {
      id: makeId(),
      name,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      passwordHash: await bcrypt.hash(body.password, 8),
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, user);
    setSessionCookie(res, signSession(user));
    res.status(201).json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

devMemoryRouter.post("/auth/login", async (req, res, next) => {
  try {
    const body = authSchema.parse(sanitizeValue(req.body));
    const user = Array.from(users.values()).find(
      (candidate) => candidate.email === body.email.toLowerCase(),
    );
    const isValid =
      user && (await bcrypt.compare(body.password, user.passwordHash));
    if (!isValid) {
      throw new AppError(
        401,
        "Invalid email or password.",
        "INVALID_CREDENTIALS",
      );
    }
    setSessionCookie(res, signSession(user));
    res.json(publicUser(user));
  } catch (error) {
    next(error);
  }
});

devMemoryRouter.post("/auth/google", (_req, res) => {
  res.status(501).json({
    error: "Google OAuth needs a real GOOGLE_CLIENT_ID and database.",
  });
});

devMemoryRouter.post("/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

devMemoryRouter.post("/auth/reset-password", (_req, res) => {
  res.json({
    success: true,
    message: "Dev reset accepted. Configure SMTP for real reset emails.",
  });
});

devMemoryRouter.post("/auth/reset", (_req, res) => {
  res.json({
    success: true,
    message: "Dev reset accepted. Configure SMTP for real reset emails.",
  });
});

devMemoryRouter.get("/db", requireDevAuth, (req, res) => {
  res.json({
    users: [req.user],
    currentUser: req.user,
    groups: groups.size ? Array.from(groups.values()) : defaultGroups,
    tasks: currentUserTasks(req.user!.id),
    goals: Array.from(goals.values()).filter(
      (goal) => goal.userId === req.user!.id,
    ),
    chatMessages: Array.from(chatMessages.values()).filter(
      (message) => message.userId === req.user!.id,
    ),
    channels: defaultChannels,
  });
});

devMemoryRouter.get("/tasks", requireDevAuth, (req, res) => {
  res.json(currentUserTasks(req.user!.id));
});

// Subtasks in dev memory (stored inside task.subtasks)
devMemoryRouter.get("/tasks/:id/subtasks", requireDevAuth, (req, res, next) => {
  try {
    const t = tasks.get(req.params.id);
    if (!t || t.userId !== req.user!.id) {
      res.status(404).json({ error: "Task not found." });
      return;
    }
    res.json(t.subtasks || []);
  } catch (err) {
    next(err);
  }
});

devMemoryRouter.post(
  "/tasks/:id/subtasks",
  requireDevAuth,
  (req, res, next) => {
    try {
      const t = tasks.get(req.params.id);
      if (!t || t.userId !== req.user!.id) {
        res.status(404).json({ error: "Task not found." });
        return;
      }
      const body = sanitizeValue(req.body);
      const id = body.id || `sub_${Date.now()}`;
      const sub = {
        id,
        parentTaskId: req.params.id,
        title: body.title || "",
        isCompleted: false,
        createdAt: new Date().toISOString(),
        sortOrder:
          typeof body.sortOrder === "number"
            ? body.sortOrder
            : (t.subtasks || []).length,
      };
      t.subtasks = t.subtasks || [];
      t.subtasks.push(sub);
      tasks.set(t.id, t);
      res.status(201).json(sub);
    } catch (err) {
      next(err);
    }
  },
);

devMemoryRouter.put(
  "/tasks/:id/subtasks/:subtaskId",
  requireDevAuth,
  (req, res, next) => {
    try {
      const t = tasks.get(req.params.id);
      if (!t || t.userId !== req.user!.id) {
        res.status(404).json({ error: "Task not found." });
        return;
      }
      const body = sanitizeValue(req.body);
      const subs = t.subtasks || [];
      const idx = subs.findIndex((s: any) => s.id === req.params.subtaskId);
      if (idx === -1) {
        res.status(404).json({ error: "Subtask not found." });
        return;
      }
      const updated = { ...subs[idx], ...body };
      subs[idx] = updated;
      t.subtasks = subs;
      tasks.set(t.id, t);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

devMemoryRouter.delete(
  "/tasks/:id/subtasks/:subtaskId",
  requireDevAuth,
  (req, res, next) => {
    try {
      const t = tasks.get(req.params.id);
      if (!t || t.userId !== req.user!.id) {
        res.status(404).json({ error: "Task not found." });
        return;
      }
      t.subtasks = (t.subtasks || []).filter(
        (s: any) => s.id !== req.params.subtaskId,
      );
      tasks.set(t.id, t);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

devMemoryRouter.post("/tasks", requireDevAuth, (req, res, next) => {
  try {
    const body = taskSchema.parse(sanitizeValue(req.body));
    const id = makeId();
    const task = {
      ...body,
      id,
      userId: req.user!.id,
      assigneeId: body.assigneeId || req.user!.id,
      status: body.status || "pending",
      priority: body.priority || "medium",
      subtasks: body.subtasks || [],
      comments: body.comments || [],
      activities: body.activities || [],
      createdAt: new Date().toISOString(),
    };
    tasks.set(id, task);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

devMemoryRouter.put("/tasks/:id", requireDevAuth, (req, res, next) => {
  try {
    const existing = tasks.get(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    }
    const updated = {
      ...existing,
      ...sanitizeValue(req.body),
      id: existing.id,
      userId: req.user!.id,
    };
    tasks.set(existing.id, updated);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

devMemoryRouter.delete("/tasks/:id", requireDevAuth, (req, res, next) => {
  try {
    const existing = tasks.get(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    }
    tasks.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

devMemoryRouter.post("/groups", requireDevAuth, (req, res) => {
  const payload = sanitizeValue(req.body);
  const id = payload.id || `group_${Date.now()}`;
  const group = {
    ...payload,
    id,
    memberIds: payload.memberIds || [req.user!.id],
  };
  groups.set(id, group);
  res.status(201).json(group);
});

devMemoryRouter.get("/goals", requireDevAuth, (req, res) => {
  res.json(
    Array.from(goals.values()).filter((goal) => goal.userId === req.user!.id),
  );
});

devMemoryRouter.post("/goals", requireDevAuth, (req, res) => {
  const payload = sanitizeValue(req.body);
  const id = payload.id || `goal_${Date.now()}`;
  const goal = { ...payload, id, userId: req.user!.id };
  goals.set(id, goal);
  res.status(201).json(goal);
});

devMemoryRouter.put("/goals/:id", requireDevAuth, (req, res) => {
  const existing = goals.get(req.params.id);
  if (!existing || existing.userId !== req.user!.id) {
    res.status(404).json({ error: "Goal not found." });
    return;
  }
  const payload = sanitizeValue(req.body);
  const updated = {
    ...existing,
    ...payload,
    id: existing.id,
    userId: req.user!.id,
  };
  goals.set(existing.id, updated);
  res.json(updated);
});

devMemoryRouter.delete("/goals/:id", requireDevAuth, (req, res) => {
  const existing = goals.get(req.params.id);
  if (!existing || existing.userId !== req.user!.id) {
    res.status(404).json({ error: "Goal not found." });
    return;
  }
  goals.delete(req.params.id);
  res.json({ success: true });
});

devMemoryRouter.post("/chat/messages", requireDevAuth, (req, res) => {
  const payload = sanitizeValue(req.body);
  const id = payload.id || `msg_${Date.now()}`;
  const message = {
    ...payload,
    id,
    userId: req.user!.id,
    createdAt: new Date().toISOString(),
  };
  chatMessages.set(id, message);
  res.status(201).json(message);
});

devMemoryRouter.post("/ai/roadmap", requireDevAuth, (_req, res) => {
  res.json({
    phases: [
      {
        phase: 1,
        title: "Configure Anthropic for live AI roadmaps",
        estimatedTime: "10 minutes",
        description:
          "Add ANTHROPIC_API_KEY to .env to enable Claude-generated task learning guides.",
        resources: [
          {
            type: "official_docs",
            title: "Anthropic API documentation",
            url: "https://docs.anthropic.com/",
            paid: false,
          },
        ],
        practiceProject:
          "Restart the local server after adding your real API key.",
      },
    ],
  });
});

devMemoryRouter.post("/attachments/upload", (_req, res) => {
  res.json({
    id: `att_${Date.now()}`,
    fileName: "dev-upload",
    fileSize: 0,
    fileType: "application/octet-stream",
    fileUrl: "",
    uploadedAt: new Date().toISOString(),
  });
});
