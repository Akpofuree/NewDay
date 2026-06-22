import { Router } from "express";
import { z } from "zod";
import { makeId, query } from "../db";
import { AppError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { sanitizeValue } from "../sanitize";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

const taskStatusSchema = z.enum(["pending", "in_progress", "completed", "overdue"]);
const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

const createTaskSchema = z
  .object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000).optional().nullable(),
    status: taskStatusSchema.default("pending"),
    priority: taskPrioritySchema.default("medium"),
    dueDate: z.string().optional().nullable(),
    tags: z.array(z.string().min(1).max(20)).max(8).optional(),
  })
  .passthrough();

const updateTaskSchema = createTaskSchema.partial().passthrough();

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  notes: string | null;
  status: string;
  priority: string;
  due_date: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  payload: Record<string, unknown>;
  tags?: string[];
};

export function mapTask(row: TaskRow) {
  return {
    ...row.payload,
    id: row.id,
    userId: row.user_id,
    assigneeId: (row.payload.assigneeId as string | undefined) || row.user_id,
    title: row.title,
    description: row.description || undefined,
    notes: row.notes || (row.payload.notes as string | undefined) || undefined,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ? new Date(row.due_date).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
    tags: row.tags || (row.payload.tags as string[]) || [],
    subtasks: (row.payload.subtasks as unknown[]) || [],
    comments: (row.payload.comments as unknown[]) || [],
    activities: (row.payload.activities as unknown[]) || [],
  };
}

type SubtaskRow = {
  id: string;
  parent_task_id: string;
  title: string;
  is_completed: boolean;
  created_at: Date | string;
  sort_order: number;
};

function mapSubtask(row: SubtaskRow) {
  return {
    id: row.id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    sortOrder: Number(row.sort_order || 0),
  };
}

async function fetchSubtasksForTaskIds(taskIds: string[]) {
  if (!taskIds.length) return {} as Record<string, any[]>;
  const res = await query<SubtaskRow>(
    `SELECT id, parent_task_id, title, is_completed, created_at, sort_order
     FROM subtasks
     WHERE parent_task_id = ANY($1)
     ORDER BY sort_order ASC`,
    [taskIds]
  );
  const map: Record<string, any[]> = {};
  for (const row of res.rows) {
    map[row.parent_task_id] = map[row.parent_task_id] || [];
    map[row.parent_task_id].push(mapSubtask(row));
  }
  return map;
}

tasksRouter.get("/", async (req, res, next) => {
  try {
    const result = await query<TaskRow>(
      `SELECT * FROM tasks
       WHERE user_id = $1::uuid OR payload->>'assigneeId' = $1::text
       ORDER BY created_at DESC`,
      [req.user!.id]
    );
    const taskRows = result.rows;
    const ids = taskRows.map((r) => r.id);
    const subtasksMap = await fetchSubtasksForTaskIds(ids);
    const mapped = taskRows.map((r) => {
      const t = mapTask(r) as any;
      t.subtasks = subtasksMap[r.id] || [];
      return t;
    });
    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const body = createTaskSchema.parse(sanitizeValue(req.body));
    const id = makeId();
    const now = new Date().toISOString();
    if (body.assigneeId && body.assigneeId !== req.user!.id) {
      if (!body.groupId) {
        throw new AppError(400, "Cannot assign task to another user without a group.", "INVALID_ASSIGNMENT");
      }
      const roleResult = await query<{ role: string }>(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        [body.groupId, req.user!.id]
      );
      const role = roleResult.rows[0]?.role;
      if (role !== "admin" && role !== "owner") {
        throw new AppError(403, "You must be an admin to assign tasks to other members.", "PERMISSION_DENIED");
      }
    }

    const payload = {
      ...body,
      id,
      assigneeId: body.assigneeId || req.user!.id,
      assignedBy: body.assigneeId && body.assigneeId !== req.user!.id ? req.user!.id : undefined,
      assignedByName: body.assigneeId && body.assigneeId !== req.user!.id ? req.user!.name : undefined,
      subtasks: body.subtasks || [],
      comments: body.comments || [],
      activities: body.activities || [
        {
          id: `act_${Date.now()}`,
          userId: req.user!.id,
          userName: req.user!.name,
          action: "created this task",
          createdAt: now,
        },
      ],
    };

    const result = await query<TaskRow>(
      `INSERT INTO tasks (id, user_id, title, description, status, priority, due_date, payload, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        req.user!.id,
        body.title,
        body.description || null,
        body.status,
        body.priority,
        body.dueDate || null,
        payload,
        body.tags || [],
      ]
    );

    res.status(201).json(mapTask(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

// Subtasks endpoints
const createSubtaskSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1).max(100),
    sortOrder: z.number().optional(),
  })
  .passthrough();

const updateSubtaskSchema = createSubtaskSchema.partial().passthrough();

tasksRouter.get("/:id/subtasks", async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const result = await query<SubtaskRow>(
      `SELECT id, parent_task_id, title, is_completed, created_at, sort_order
       FROM subtasks
       WHERE parent_task_id = $1
       ORDER BY sort_order ASC`,
      [taskId]
    );
    res.json(result.rows.map(mapSubtask));
  } catch (error) {
    next(error);
  }
});

tasksRouter.post("/:id/subtasks", async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const body = createSubtaskSchema.parse(sanitizeValue(req.body));
    const id = body.id || makeId();
    await query(
      `INSERT INTO subtasks (id, parent_task_id, title, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [id, taskId, body.title, body.sortOrder || 0]
    );
    const created = await query<SubtaskRow>(
      `SELECT id, parent_task_id, title, is_completed, created_at, sort_order FROM subtasks WHERE id = $1`,
      [id]
    );
    res.status(201).json(mapSubtask(created.rows[0]));
  } catch (error) {
    next(error);
  }
});

tasksRouter.put("/:id/subtasks/:subtaskId", async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const subId = req.params.subtaskId;
    const body = updateSubtaskSchema.parse(sanitizeValue(req.body));

    const existing = await query<SubtaskRow>(
      `SELECT * FROM subtasks WHERE id = $1 AND parent_task_id = $2`,
      [subId, taskId]
    );
    if (!existing.rowCount) {
      throw new AppError(404, "Subtask not found.", "SUBTASK_NOT_FOUND");
    }

    const updated = {
      title: body.title ?? existing.rows[0].title,
      is_completed:
        typeof body.isCompleted !== "undefined" ? body.isCompleted : existing.rows[0].is_completed,
      sort_order:
        typeof body.sortOrder !== "undefined" ? body.sortOrder : existing.rows[0].sort_order,
    };

    await query(
      `UPDATE subtasks SET title = $1, is_completed = $2, sort_order = $3 WHERE id = $4 AND parent_task_id = $5`,
      [updated.title, updated.is_completed, updated.sort_order, subId, taskId]
    );

    const result = await query<SubtaskRow>(
      `SELECT id, parent_task_id, title, is_completed, created_at, sort_order FROM subtasks WHERE id = $1`,
      [subId]
    );
    res.json(mapSubtask(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete("/:id/subtasks/:subtaskId", async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const subId = req.params.subtaskId;
    const result = await query("DELETE FROM subtasks WHERE id = $1 AND parent_task_id = $2", [
      subId,
      taskId,
    ]);
    if (!result.rowCount) {
      throw new AppError(404, "Subtask not found.", "SUBTASK_NOT_FOUND");
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

tasksRouter.put("/:id", async (req, res, next) => {
  try {
    const body = updateTaskSchema.parse(sanitizeValue(req.body));
    const current = await query<TaskRow>("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user!.id,
    ]);

    if (!current.rowCount) {
      throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    }

    const existing = current.rows[0];
    if (body.assigneeId && body.assigneeId !== existing.payload.assigneeId && body.assigneeId !== req.user!.id) {
      const groupId = body.groupId || existing.payload.groupId;
      if (!groupId) {
        throw new AppError(400, "Cannot assign task to another user without a group.", "INVALID_ASSIGNMENT");
      }
      const roleResult = await query<{ role: string }>(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
        [groupId, req.user!.id]
      );
      const role = roleResult.rows[0]?.role;
      if (role !== "admin" && role !== "owner") {
        throw new AppError(403, "You must be an admin to assign tasks to other members.", "PERMISSION_DENIED");
      }
    }

    const mergedPayload = {
      ...existing.payload,
      ...body,
      id: existing.id,
      assigneeId: body.assigneeId || existing.payload.assigneeId || req.user!.id,
      assignedBy: body.assigneeId && body.assigneeId !== existing.payload.assigneeId && body.assigneeId !== req.user!.id ? req.user!.id : existing.payload.assignedBy,
      assignedByName: body.assigneeId && body.assigneeId !== existing.payload.assigneeId && body.assigneeId !== req.user!.id ? req.user!.name : existing.payload.assignedByName,
    };

    const result = await query<TaskRow>(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           status = $3,
           priority = $4,
           due_date = $5,
           payload = $6,
           tags = $7,
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        body.title ?? existing.title,
        body.description ?? existing.description,
        body.status ?? existing.status,
        body.priority ?? existing.priority,
        body.dueDate ?? existing.due_date,
        mergedPayload,
        (body.tags ?? (existing.payload.tags as string[])) || [],
        req.params.id,
        req.user!.id,
      ]
    );

    res.json(mapTask(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user!.id,
    ]);

    if (!result.rowCount) {
      throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

tasksRouter.patch("/:id/notes", async (req, res, next) => {
  try {
    const { notes } = req.body;
    const current = await query<TaskRow>("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user!.id,
    ]);

    if (!current.rowCount) {
      throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    }

    const existing = current.rows[0];
    const mergedPayload = {
      ...existing.payload,
      notes,
    };

    const result = await query<TaskRow>(
      `UPDATE tasks
       SET notes = $1,
           payload = $2,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [notes || null, mergedPayload, req.params.id, req.user!.id]
    );

    res.json(mapTask(result.rows[0]));
  } catch (error) {
    next(error);
  }
});
