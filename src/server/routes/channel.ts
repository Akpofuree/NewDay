import { Router } from "express";
import { z } from "zod";
import { makeId, query } from "../db";
import { AppError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { sanitizeValue } from "../sanitize";

export const channelsRouter = Router();

channelsRouter.use(requireAuth);

// ─── GET /api/channels ───────────────────────────────────
// Returns all channels belonging to the current user's groups
channelsRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const result = await query<{
      id: string;
      group_id: string;
      name: string;
      description: string | null;
      created_by: string | null;
      created_at: Date;
      unread_count?: number;
    }>(
      `SELECT c.*
       FROM channels c
       INNER JOIN groups g ON g.id = c.group_id
       WHERE g.user_id = $1
          OR g.id IN (
            SELECT gm.group_id FROM group_members gm
            WHERE gm.user_id = $1
          )
       ORDER BY c.created_at ASC`,
      [userId]
    );

    const channels = result.rows.map((row) => ({
      id: row.id,
      groupId: row.group_id,
      name: row.name,
      description: row.description || undefined,
      createdBy: row.created_by || undefined,
      createdAt: new Date(row.created_at).toISOString(),
      unreadCount: 0,
    }));

    res.json(channels);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/channels ──────────────────────────────────
// Creates a new channel inside a group
const createChannelSchema = z.object({
  groupId: z.string().min(1),
  name: z
    .string()
    .min(1)
    .max(80)
    .transform((v) => v.toLowerCase().trim().replace(/\s+/g, "-")),
  description: z.string().max(300).optional(),
});

channelsRouter.post("/", async (req, res, next) => {
  try {
    const body = createChannelSchema.parse(sanitizeValue(req.body));
    const userId = req.user!.id;

    // Verify the group exists and belongs to this user
    const groupCheck = await query(`SELECT id FROM groups WHERE id = $1 AND user_id = $2`, [
      body.groupId,
      userId,
    ]);

    if (!groupCheck.rowCount) {
      throw new AppError(403, "Group not found.", "GROUP_NOT_FOUND");
    }

    // Check for duplicate channel name in this group
    const duplicate = await query(`SELECT id FROM channels WHERE group_id = $1 AND name = $2`, [
      body.groupId,
      body.name,
    ]);

    if (duplicate.rowCount) {
      throw new AppError(409, "A channel with this name already exists.", "CHANNEL_EXISTS");
    }

    const id = `chan_${makeId()}`;

    await query(
      `INSERT INTO channels (id, group_id, name, description, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, body.groupId, body.name, body.description || null, userId]
    );

    const created = await query<{
      id: string;
      group_id: string;
      name: string;
      description: string | null;
      created_by: string | null;
      created_at: Date;
    }>(`SELECT * FROM channels WHERE id = $1`, [id]);

    const row = created.rows[0];

    res.status(201).json({
      id: row.id,
      groupId: row.group_id,
      name: row.name,
      description: row.description || undefined,
      createdBy: row.created_by || undefined,
      createdAt: new Date(row.created_at).toISOString(),
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/channels/:channelId/read ──────────────────
// Marks a channel as read for the current user
channelsRouter.post("/:channelId/read", async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    await query(
      `INSERT INTO channel_members (channel_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (channel_id, user_id)
       DO UPDATE SET last_read_at = NOW()`,
      [channelId, userId]
    );

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/channels/:channelId ─────────────────────
// Deletes a channel (admin or owner)
channelsRouter.delete("/:channelId", async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    const channel = await query(`SELECT c.id, c.group_id FROM channels c WHERE c.id = $1`, [
      channelId,
    ]);

    if (!channel.rowCount) {
      throw new AppError(404, "Channel not found.", "CHANNEL_NOT_FOUND");
    }

    const groupId = channel.rows[0].group_id;

    // Check if user is admin or owner of the group
    const roleResult = await query(
      `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    const role = roleResult.rows[0]?.role || "member";
    if (role !== "admin" && role !== "owner") {
      throw new AppError(
        403,
        "Admin or owner access required to delete channels.",
        "CHANNEL_DELETE_FORBIDDEN"
      );
    }

    await query(`DELETE FROM channels WHERE id = $1`, [channelId]);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
