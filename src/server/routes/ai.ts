import { Router } from "express";
import { z } from "zod";
import { query } from "../db";
import { AppError } from "../errors";
import { requireAuth } from "../middleware/auth";
import {
  generateTaskRoadmap,
  generateAICoachResponse,
  generateChatAssistantResponse,
} from "../services/anthropic";
import { mapTask } from "./tasks";

export const aiRouter = Router();

const legacyRoadmapSchema = z.object({
  skillName: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
});

aiRouter.post("/tasks/:id/ai-guide", requireAuth, async (req, res, next) => {
  try {
    const taskResult = await query("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user!.id,
    ]);

    if (!taskResult.rowCount) {
      throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
    }

    const task = mapTask(taskResult.rows[0] as never);
    const roadmap = await generateTaskRoadmap({
      title: task.title,
      description: task.description,
      status: task.status,
    });

    const payload = {
      ...(taskResult.rows[0].payload || {}),
      isLearningGoal: true,
      aiRoadmap: roadmap.phases.map((phase) => ({ ...phase, completed: false })),
    };

    await query(
      `UPDATE tasks SET payload = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [payload, req.params.id, req.user!.id]
    );

    res.json(roadmap);
  } catch (error) {
    next(error);
  }
});

aiRouter.post("/roadmap", requireAuth, async (req, res, next) => {
  try {
    const body = legacyRoadmapSchema.parse(req.body);
    const roadmap = await generateTaskRoadmap({
      title: body.skillName,
      description: body.description,
      status: "pending",
    });
    res.json(roadmap);
  } catch (error) {
    next(error);
  }
});

aiRouter.post("/chat", requireAuth, async (req, res, next) => {
  try {
    const { taskId, taskTitle, message, history } = req.body;

    // Attempt to fetch description details if available from db and taskId is a valid UUID
    let description = "";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (taskId && uuidRegex.test(taskId)) {
      const taskResult = await query(
        "SELECT description FROM tasks WHERE id = $1 AND user_id = $2",
        [taskId, req.user!.id]
      );
      description = taskResult.rowCount ? taskResult.rows[0].description || "" : "";
    }

    const coachResponse = await generateAICoachResponse({
      taskTitle,
      taskDescription: description,
      message,
      history: history || [],
    });

    res.json(coachResponse);
  } catch (error) {
    next(error);
  }
});

aiRouter.post("/chat-assistant", requireAuth, async (req, res, next) => {
  try {
    const { message, channelId, recentMessages } = req.body;

    const assistantResponse = await generateChatAssistantResponse({
      message,
      recentMessages: recentMessages || [],
    });

    res.json(assistantResponse);
  } catch (error) {
    next(error);
  }
});
