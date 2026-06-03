import { createHash, randomBytes } from "crypto";
import { Router } from "express";
import { defaultChannels, defaultGroups, makeId, query } from "../db";
import { AppError } from "../errors";
import { requireAuth } from "../middleware/auth";
import { sanitizeValue } from "../sanitize";
import { mapTask } from "./tasks";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);

type GroupPayload = {
  id: string;
  name: string;
  description?: string;
  color: string;
  ownerId?: string | null;
  role?: "owner" | "admin" | "member";
  visibility?: "public" | "private";
  avatarUrl?: string | null;
  createdAt?: string;
  memberIds?: string[];
};

type ChannelPayload = {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  createdBy?: string | null;
  createdAt?: string;
  memberIds?: string[];
  unreadCount?: number;
};

function normalizeGroup(payload: any, userId: string): GroupPayload {
  return {
    id: String(payload.id || `group_${Date.now()}`),
    name: String(payload.name || "Untitled group")
      .trim()
      .slice(0, 120),
    description: payload.description
      ? String(payload.description).slice(0, 500)
      : undefined,
    color: String(payload.color || "#5C27FE").slice(0, 24),
    ownerId: payload.ownerId || userId,
    role: payload.role || "owner",
    visibility: payload.visibility === "public" ? "public" : "private",
    avatarUrl: payload.avatarUrl || null,
    createdAt: payload.createdAt || new Date().toISOString(),
    memberIds: Array.isArray(payload.memberIds) ? payload.memberIds : [userId],
  };
}

function mapGroup(row: any): GroupPayload {
  const payload = row.payload || {};
  return {
    ...payload,
    id: row.id,
    name: row.name || payload.name || "Untitled group",
    description: row.description || payload.description || undefined,
    color: row.color || payload.color || "#5C27FE",
    ownerId: row.owner_id || payload.ownerId || null,
    visibility: row.visibility || payload.visibility || "private",
    avatarUrl: row.avatar_url || payload.avatarUrl || null,
    role: row.role || payload.role || "member",
    createdAt:
      row.created_at?.toISOString?.() || payload.createdAt || row.created_at,
    memberIds: row.member_ids || payload.memberIds || [],
  };
}

function mapChannel(row: any): ChannelPayload {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    description: row.description || undefined,
    createdBy: row.created_by,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    memberIds: row.member_ids || [],
    unreadCount: Number(row.unread_count || 0),
  };
}

function mapGoalRow(row: any) {
  return {
    id: row.id,
    title: row.title || "",
    description: row.description || undefined,
    targetDate: row.target_date || undefined,
    progress: Number(row.progress || 0),
    linkedTaskIds: row.linked_task_ids || [],
    milestones: row.milestones || [],
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

function mapMessage(row: any) {
  return {
    ...(row.payload || {}),
    id: row.id,
    channelId: row.channel_id,
    senderId: row.sender_id,
    content: row.content,
    attachments: row.attachments || [],
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    userName: row.sender_name || row.payload?.userName,
  };
}

function mapChatMessageRow(row: any) {
  const payload = row.payload || {};
  return {
    id: row.id,
    channelId: row.channel_id,
    userId: row.user_id || row.sender_id,
    userName: row.user_name || row.sender_name || payload.userName,
    userAvatar: row.user_avatar || payload.userAvatar || undefined,
    content: row.content,
    attachments: row.attachments || payload.attachments || [],
    taskRefId: payload.taskRefId || undefined,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
  };
}

async function ensureDefaultWorkspace(userId: string) {
  const group = normalizeGroup(
    { ...defaultGroups[0], ownerId: userId, memberIds: [userId] },
    userId,
  );
  await query(
    `INSERT INTO groups (id, user_id, payload)
     VALUES ($1, NULL, $2)
     ON CONFLICT (id) DO NOTHING`,
    [group.id, group],
  );
  await query(
    `INSERT INTO group_members (group_id, user_id, role)
     VALUES ($1, $2, 'owner')
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [group.id, userId],
  );

  const channel = defaultChannels[0];
  await query(
    `INSERT INTO channels (id, group_id, name, description, created_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [channel.id, channel.groupId, channel.name, channel.description, userId],
  );
  await query(
    `INSERT INTO channel_members (channel_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (channel_id, user_id) DO NOTHING`,
    [channel.id, userId],
  );
}

async function getGroupRole(groupId: string, userId: string) {
  const result = await query<{ role: "owner" | "admin" | "member" }>(
    "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2",
    [groupId, userId],
  );
  return result.rows[0]?.role || null;
}

function canAdmin(role: string | null) {
  return role === "owner" || role === "admin";
}

async function requireGroupAdmin(groupId: string, userId: string) {
  const role = await getGroupRole(groupId, userId);
  if (!canAdmin(role)) {
    throw new AppError(
      403,
      "Owner or admin access required.",
      "GROUP_ADMIN_REQUIRED",
    );
  }
  return role;
}

workspaceRouter.get("/db", async (req, res, next) => {
  try {
    await ensureDefaultWorkspace(req.user!.id);

    const [tasks, groups, goals, channels, chatMessages] = await Promise.all([
      query(
        `SELECT t.id, t.user_id, t.title, t.description, t.status, t.priority,
                t.due_date, t.payload, t.created_at, t.updated_at, t.tags
         FROM tasks t
         WHERE t.user_id = $1
         ORDER BY t.created_at DESC`,
        [req.user!.id],
      ),
      query(
        `SELECT g.id,
                g.user_id,
                g.owner_id,
                g.name,
                g.description,
                g.color,
                g.visibility,
                g.avatar_url,
                g.payload,
                g.created_at,
                g.updated_at,
                gm.role,
                COALESCE(array_agg(DISTINCT all_members.user_id::text) FILTER (WHERE all_members.user_id IS NOT NULL), '{}') AS member_ids
         FROM groups g
         LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
         LEFT JOIN group_members all_members ON all_members.group_id = g.id
         WHERE g.user_id = $1 OR g.user_id IS NULL OR gm.user_id IS NOT NULL
         GROUP BY g.id, g.user_id, g.owner_id, g.name, g.description,
                  g.color, g.visibility, g.avatar_url, g.payload,
                  g.created_at, g.updated_at, gm.role
         ORDER BY g.created_at ASC`,
        [req.user!.id],
      ),
      query(
        `SELECT goals.id,
                goals.title,
                goals.description,
                goals.target_date,
                goals.progress,
                goals.linked_task_ids,
                goals.milestones,
                goals.created_at
         FROM goals
         WHERE goals.user_id = $1
         ORDER BY goals.created_at DESC`,
        [req.user!.id],
      ),
      query(
        `SELECT c.id,
                c.group_id,
                c.name,
                c.description,
                c.created_by,
                c.created_at,
                COALESCE(array_agg(DISTINCT cm.user_id::text) FILTER (WHERE cm.user_id IS NOT NULL), '{}') AS member_ids,
                COUNT(DISTINCT m.id) FILTER (
                  WHERE m.sender_id <> $1
                    AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
                ) AS unread_count
         FROM channels c
         JOIN groups g ON g.id = c.group_id
         LEFT JOIN group_members gm2 ON gm2.group_id = g.id AND gm2.user_id = $1
         LEFT JOIN channel_members cm ON cm.channel_id = c.id
         LEFT JOIN channel_messages m ON m.channel_id = c.id
         WHERE (g.user_id = $1 OR g.user_id IS NULL OR gm2.user_id IS NOT NULL)
         GROUP BY c.id, c.group_id, c.name, c.description, c.created_by, c.created_at
         ORDER BY c.created_at ASC`,
        [req.user!.id],
      ),
      query(
        `SELECT m.id,
                m.channel_id,
                m.user_id,
                m.user_name,
                m.user_avatar,
                m.content,
                m.attachments,
                m.payload,
                m.created_at,
                m.updated_at
         FROM (
           SELECT cm.id,
                  cm.channel_id,
                  cm.sender_id::text AS user_id,
                  u.name AS user_name,
                  u.avatar_url AS user_avatar,
                  cm.content,
                  cm.attachments,
                  cm.payload,
                  cm.created_at,
                  cm.updated_at
           FROM channel_messages cm
           JOIN users u ON u.id = cm.sender_id
           UNION ALL
           SELECT chat.id,
                  chat.channel_id,
                  chat.user_id,
                  chat.user_name,
                  chat.user_avatar,
                  chat.content,
                  '[]'::jsonb AS attachments,
                  '{}'::jsonb AS payload,
                  chat.created_at,
                  chat.created_at AS updated_at
           FROM chat_messages chat
           WHERE chat.id NOT IN (SELECT channel_messages.id FROM channel_messages)
         ) AS m
         JOIN channels c ON c.id = m.channel_id
         JOIN groups g ON g.id = c.group_id
         LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
         WHERE g.user_id = $1 OR g.user_id IS NULL OR gm.user_id IS NOT NULL
         ORDER BY m.created_at DESC
         LIMIT 50`,
        [req.user!.id],
      ),
    ]);

    const groupsPayload = groups.rows.map(mapGroup);
    const normalizedMessages = chatMessages.rows.map(mapChatMessageRow);

    const taskRows = tasks.rows;
    const taskIds = taskRows.map((r: any) => r.id);
    let subtasksMap: Record<string, any[]> = {};
    if (taskIds.length) {
      const subsRes = await query(
        `SELECT sub.id,
                sub.parent_task_id,
                sub.title,
                sub.is_completed,
                sub.created_at,
                sub.sort_order
         FROM subtasks sub
         WHERE sub.parent_task_id = ANY($1)
         ORDER BY sub.sort_order ASC`,
        [taskIds],
      );
      for (const row of subsRes.rows) {
        subtasksMap[row.parent_task_id] = subtasksMap[row.parent_task_id] || [];
        subtasksMap[row.parent_task_id].push({
          id: row.id,
          parentTaskId: row.parent_task_id,
          title: row.title,
          isCompleted: Boolean(row.is_completed),
          createdAt: row.created_at?.toISOString?.() || row.created_at,
          sortOrder: Number(row.sort_order || 0),
        });
      }
    }

    const mappedTasks = taskRows.map((r: any) => {
      const t = mapTask(r as any) as any;
      t.subtasks = subtasksMap[r.id] || [];
      return t;
    });

    res.json({
      users: [req.user],
      currentUser: req.user,
      groups: groupsPayload.length ? groupsPayload : defaultGroups,
      tasks: mappedTasks,
      goals: goals.rows.map(mapGoalRow),
      chatMessages: normalizedMessages,
      channels: channels.rows.length ? channels.rows.map(mapChannel) : [],
    });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.get("/channels", async (req, res, next) => {
  try {
    const channelsRes = await query(
      `SELECT c.id,
              c.group_id,
              c.name,
              c.description,
              c.created_by,
              c.created_at,
              COALESCE(array_agg(DISTINCT cm.user_id::text) FILTER (WHERE cm.user_id IS NOT NULL), '{}') AS member_ids,
              COUNT(DISTINCT m.id) FILTER (
                WHERE m.sender_id <> $1
                  AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
              ) AS unread_count
       FROM channels c
       JOIN groups g ON g.id = c.group_id
       LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       LEFT JOIN channel_members cm ON cm.channel_id = c.id
       LEFT JOIN channel_messages m ON m.channel_id = c.id
       WHERE g.user_id = $1 OR g.user_id IS NULL OR gm.user_id = $1
       GROUP BY c.id, c.group_id, c.name, c.description, c.created_by, c.created_at
       ORDER BY c.created_at ASC`,
      [req.user!.id],
    );
    res.json(channelsRes.rows.map(mapChannel));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/groups", async (req, res, next) => {
  try {
    const payload = sanitizeValue(req.body);
    const finalPayload = normalizeGroup(
      { ...payload, id: payload.id || `group_${Date.now()}` },
      req.user!.id,
    );
    await query(
      `INSERT INTO groups (id, user_id, owner_id, name, description, color, visibility, avatar_url, payload)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           color = EXCLUDED.color,
           visibility = EXCLUDED.visibility,
           avatar_url = EXCLUDED.avatar_url,
           payload = EXCLUDED.payload,
           updated_at = NOW()`,
      [
        finalPayload.id,
        req.user!.id,
        finalPayload.name,
        finalPayload.description || null,
        finalPayload.color,
        finalPayload.visibility || "private",
        finalPayload.avatarUrl || null,
        finalPayload,
      ],
    );
    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'owner'`,
      [finalPayload.id, req.user!.id],
    );

    const defaultChannelId = `chan_${makeId()}`;
    await query(
      `INSERT INTO channels (id, group_id, name, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [
        defaultChannelId,
        finalPayload.id,
        "📢 general-desk",
        "Team-wide updates and daily coordination.",
        req.user!.id,
      ],
    );

    res.status(201).json(finalPayload);
  } catch (error) {
    next(error);
  }
});

workspaceRouter.get("/groups/:groupId/members", async (req, res, next) => {
  try {
    await requireGroupAdmin(req.params.groupId, req.user!.id);
    const members = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.bio, u.timezone, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY CASE gm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, u.name`,
      [req.params.groupId],
    );
    res.json(
      members.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatar_url,
        bio: row.bio || "",
        timezone: row.timezone || "UTC",
        role: row.role,
        joinedAt: row.joined_at,
      })),
    );
  } catch (error) {
    next(error);
  }
});

workspaceRouter.patch("/groups/:groupId", async (req, res, next) => {
  try {
    await requireGroupAdmin(req.params.groupId, req.user!.id);
    const payload = sanitizeValue(req.body);
    const visibility = payload.visibility === "public" ? "public" : "private";
    const result = await query(
      `UPDATE groups
       SET name = COALESCE($2, name),
           description = $3,
           color = COALESCE($4, color),
           visibility = $5,
           avatar_url = $6,
           payload = payload || $7::jsonb,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        req.params.groupId,
        payload.name ? String(payload.name).slice(0, 120) : null,
        payload.description ? String(payload.description).slice(0, 500) : null,
        payload.color ? String(payload.color).slice(0, 24) : null,
        visibility,
        payload.avatarUrl || null,
        JSON.stringify({
          name: payload.name,
          description: payload.description,
          color: payload.color,
          visibility,
          avatarUrl: payload.avatarUrl || null,
        }),
      ],
    );
    res.json(
      mapGroup({
        ...result.rows[0],
        role: await getGroupRole(req.params.groupId, req.user!.id),
      }),
    );
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/groups/:groupId/invitations", async (req, res, next) => {
  try {
    await requireGroupAdmin(req.params.groupId, req.user!.id);
    const payload = sanitizeValue(req.body);
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const role = payload.role === "admin" ? "admin" : "member";
    const id = `invite_${makeId()}`;
    await query(
      `INSERT INTO group_invitations (id, group_id, email, token_hash, role, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')`,
      [
        id,
        req.params.groupId,
        payload.email ? String(payload.email).toLowerCase() : null,
        tokenHash,
        role,
        req.user!.id,
      ],
    );
    const origin =
      req.headers.origin ||
      `${req.protocol}://${req.get("host")}` ||
      process.env.APP_URL ||
      "http://localhost:3000";
    res.status(201).json({
      id,
      token,
      inviteUrl: `${origin.replace(/\/$/, "")}/invite/${token}`,
      role,
      email: payload.email || null,
    });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/groups/join", async (req, res, next) => {
  try {
    const payload = sanitizeValue(req.body);
    const tokenHash = createHash("sha256")
      .update(String(payload.token || ""))
      .digest("hex");
    const invite = await query(
      `UPDATE group_invitations
       SET accepted_by = $1, accepted_at = NOW()
       WHERE token_hash = $2
         AND accepted_at IS NULL
         AND expires_at > NOW()
         AND (email IS NULL OR email = $3)
       RETURNING group_id, role`,
      [req.user!.id, tokenHash, req.user!.email.toLowerCase()],
    );
    if (!invite.rowCount) {
      res.status(400).json({
        error: "Invite link is invalid, expired, or assigned to another email.",
      });
      return;
    }
    await query(
      `INSERT INTO group_members (group_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [invite.rows[0].group_id, req.user!.id, invite.rows[0].role],
    );
    res.json({ success: true, groupId: invite.rows[0].group_id });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post(
  "/groups/:groupId/join-requests",
  async (req, res, next) => {
    try {
      const group = await query("SELECT visibility FROM groups WHERE id = $1", [
        req.params.groupId,
      ]);
      if (!group.rowCount || group.rows[0].visibility !== "public") {
        res.status(404).json({ error: "Public group not found." });
        return;
      }
      const id = `join_${makeId()}`;
      await query(
        `INSERT INTO group_join_requests (id, group_id, user_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'pending', created_at = NOW()`,
        [id, req.params.groupId, req.user!.id],
      );
      res.status(201).json({ success: true, id });
    } catch (error) {
      next(error);
    }
  },
);

workspaceRouter.get(
  "/groups/:groupId/join-requests",
  async (req, res, next) => {
    try {
      await requireGroupAdmin(req.params.groupId, req.user!.id);
      const requests = await query(
        `SELECT jr.id, jr.user_id, jr.status, jr.created_at,
                u.name, u.email, u.avatar_url
         FROM group_join_requests jr
         JOIN users u ON u.id = jr.user_id
         WHERE jr.group_id = $1 AND jr.status = 'pending'
         ORDER BY jr.created_at ASC`,
        [req.params.groupId],
      );
      res.json(
        requests.rows.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
        })),
      );
    } catch (error) {
      next(error);
    }
  },
);

workspaceRouter.post(
  "/groups/:groupId/join-requests/:requestId/approve",
  async (req, res, next) => {
    try {
      await requireGroupAdmin(req.params.groupId, req.user!.id);
      const request = await query(
        `UPDATE group_join_requests
         SET status = 'approved', decided_by = $1, decided_at = NOW()
         WHERE id = $2 AND group_id = $3 AND status = 'pending'
         RETURNING user_id`,
        [req.user!.id, req.params.requestId, req.params.groupId],
      );
      if (!request.rowCount) {
        res.status(404).json({ error: "Join request not found." });
        return;
      }
      await query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [req.params.groupId, request.rows[0].user_id],
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

workspaceRouter.post(
  "/groups/:groupId/transfer-ownership",
  async (req, res, next) => {
    try {
      const role = await getGroupRole(req.params.groupId, req.user!.id);
      if (role !== "owner") {
        res
          .status(403)
          .json({ error: "Only the owner can transfer ownership." });
        return;
      }
      const payload = sanitizeValue(req.body);
      const targetUserId = String(payload.userId || "");
      await query(
        "UPDATE groups SET owner_id = $2, user_id = $2, updated_at = NOW() WHERE id = $1",
        [req.params.groupId, targetUserId],
      );
      await query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'owner'`,
        [req.params.groupId, targetUserId],
      );
      await query(
        "UPDATE group_members SET role = $3 WHERE group_id = $1 AND user_id = $2",
        [req.params.groupId, req.user!.id, "admin"],
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

workspaceRouter.patch(
  "/groups/:groupId/members/:userId",
  async (req, res, next) => {
    try {
      const actorRole = await getGroupRole(req.params.groupId, req.user!.id);
      if (actorRole !== "owner") {
        res
          .status(403)
          .json({ error: "Only the owner can change member roles." });
        return;
      }
      const payload = sanitizeValue(req.body);
      const role = payload.role === "admin" ? "admin" : "member";
      await query(
        `UPDATE group_members SET role = $3
         WHERE group_id = $1 AND user_id = $2 AND role <> 'owner'`,
        [req.params.groupId, req.params.userId, role],
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

workspaceRouter.delete(
  "/groups/:groupId/members/:userId",
  async (req, res, next) => {
    try {
      await requireGroupAdmin(req.params.groupId, req.user!.id);
      await query(
        `DELETE FROM group_members
         WHERE group_id = $1 AND user_id = $2 AND role <> 'owner'`,
        [req.params.groupId, req.params.userId],
      );
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

workspaceRouter.patch("/profile", async (req, res, next) => {
  try {
    const payload = sanitizeValue(req.body);
    const preferences = payload.notificationPreferences || {};
    const user = await query(
      `UPDATE users
       SET name = COALESCE($2, name),
           bio = $3,
           timezone = COALESCE($4, timezone),
           avatar_url = COALESCE($5, avatar_url),
           notification_preferences = notification_preferences || $6::jsonb,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, avatar_url, bio, timezone, notification_preferences, created_at`,
      [
        req.user!.id,
        payload.name ? String(payload.name).slice(0, 120) : null,
        payload.bio ? String(payload.bio).slice(0, 500) : null,
        payload.timezone ? String(payload.timezone).slice(0, 80) : null,
        payload.avatarUrl || null,
        JSON.stringify(preferences),
      ],
    );
    const row: any = user.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar_url,
      bio: row.bio || "",
      timezone: row.timezone || "UTC",
      notificationPreferences: row.notification_preferences,
      createdAt: row.created_at,
    });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/channels", async (req, res, next) => {
  try {
    const payload = sanitizeValue(req.body);
    const groupId = String(payload.groupId || "");
    const group = await query(
      `SELECT g.id FROM groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2
       WHERE g.id = $1 AND (g.user_id = $2 OR gm.role IN ('owner', 'admin'))`,
      [groupId, req.user!.id],
    );
    if (!group.rowCount) {
      res.status(404).json({ error: "Group not found." });
      return;
    }

    const name = String(payload.name || "")
      .trim()
      .replace(/^#/, "")
      .slice(0, 80);
    if (!name) {
      res.status(400).json({ error: "Channel name is required." });
      return;
    }

    const id = payload.id || `chan_${makeId()}`;
    const result = await query(
      `INSERT INTO channels (id, group_id, name, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id, group_id, name, description, created_by, created_at`,
      [id, groupId, name, payload.description || null, req.user!.id],
    );
    await query(
      `INSERT INTO channel_members (channel_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (channel_id, user_id) DO NOTHING`,
      [id, req.user!.id],
    );
    res
      .status(201)
      .json(mapChannel({ ...result.rows[0], member_ids: [req.user!.id] }));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/channels/:channelId/join", async (req, res, next) => {
  try {
    const channelId = req.params.channelId;
    const channel = await query(
      `SELECT c.id FROM channels c
       JOIN groups g ON g.id = c.group_id
       LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2
       WHERE c.id = $1 AND (g.user_id = $2 OR g.user_id IS NULL OR gm.user_id IS NOT NULL)`,
      [channelId, req.user!.id],
    );
    if (!channel.rowCount) {
      res.status(404).json({ error: "Channel not found." });
      return;
    }
    await query(
      `INSERT INTO channel_members (channel_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (channel_id, user_id) DO UPDATE SET last_read_at = NOW()`,
      [channelId, req.user!.id],
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/channels/:channelId/read", async (req, res, next) => {
  try {
    await query(
      `INSERT INTO channel_members (channel_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (channel_id, user_id) DO UPDATE SET last_read_at = NOW()`,
      [req.params.channelId, req.user!.id],
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.get("/goals", async (req, res, next) => {
  try {
    const goals = await query(
      `SELECT goals.id,
              goals.title,
              goals.description,
              goals.target_date,
              goals.progress,
              goals.linked_task_ids,
              goals.milestones,
              goals.created_at
       FROM goals
       WHERE goals.user_id = $1
       ORDER BY goals.created_at DESC`,
      [req.user!.id],
    );
    res.json(goals.rows.map(mapGoalRow));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/goals", async (req, res, next) => {
  try {
    const payload = sanitizeValue(req.body);
    const id = String(payload.id || `goal_${Date.now()}`);
    const title = String(payload.title || "")
      .trim()
      .slice(0, 280);
    if (!title) {
      throw new AppError(400, "Goal title is required.", "GOAL_TITLE_REQUIRED");
    }
    const description = payload.description
      ? String(payload.description).slice(0, 1000)
      : null;
    const targetDate = payload.targetDate
      ? String(payload.targetDate).trim()
      : null;
    const progress = Number.isFinite(Number(payload.progress))
      ? Math.min(100, Math.max(0, Number(payload.progress)))
      : 0;
    const linkedTaskIds = Array.isArray(payload.linkedTaskIds)
      ? payload.linkedTaskIds.map(String)
      : [];
    const milestones = Array.isArray(payload.milestones)
      ? payload.milestones
      : [];

    const existing = await query("SELECT user_id FROM goals WHERE id = $1", [
      id,
    ]);
    if (existing.rowCount && existing.rows[0].user_id !== req.user!.id) {
      throw new AppError(
        403,
        "Goal belongs to a different user.",
        "FORBIDDEN_GOAL_UPDATE",
      );
    }

    const result = await query(
      `INSERT INTO goals (id, user_id, title, description, target_date, progress, linked_task_ids, milestones, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
       SET title = EXCLUDED.title,
           description = EXCLUDED.description,
           target_date = EXCLUDED.target_date,
           progress = EXCLUDED.progress,
           linked_task_ids = EXCLUDED.linked_task_ids,
           milestones = EXCLUDED.milestones,
           payload = EXCLUDED.payload,
           updated_at = NOW()
       RETURNING id, title, description, target_date, progress, linked_task_ids, milestones, created_at`,
      [
        id,
        req.user!.id,
        title,
        description,
        targetDate,
        progress,
        linkedTaskIds,
        milestones,
        { ...payload, id },
      ],
    );

    res.json(mapGoalRow(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.put("/goals/:goalId", async (req, res, next) => {
  try {
    const payload = sanitizeValue(req.body);
    const goalId = String(req.params.goalId);
    const title = String(payload.title || "")
      .trim()
      .slice(0, 280);
    if (!title) {
      throw new AppError(400, "Goal title is required.", "GOAL_TITLE_REQUIRED");
    }
    const description = payload.description
      ? String(payload.description).slice(0, 1000)
      : null;
    const targetDate = payload.targetDate
      ? String(payload.targetDate).trim()
      : null;
    const progress = Number.isFinite(Number(payload.progress))
      ? Math.min(100, Math.max(0, Number(payload.progress)))
      : 0;
    const linkedTaskIds = Array.isArray(payload.linkedTaskIds)
      ? payload.linkedTaskIds.map(String)
      : [];
    const milestones = Array.isArray(payload.milestones)
      ? payload.milestones
      : [];

    const result = await query(
      `UPDATE goals
       SET title = $1,
           description = $2,
           target_date = $3,
           progress = $4,
           linked_task_ids = $5,
           milestones = $6,
           payload = $7,
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING id, title, description, target_date, progress, linked_task_ids, milestones, created_at`,
      [
        title,
        description,
        targetDate,
        progress,
        linkedTaskIds,
        milestones,
        { ...payload, id: goalId },
        goalId,
        req.user!.id,
      ],
    );

    if (!result.rowCount) {
      throw new AppError(404, "Goal not found.", "GOAL_NOT_FOUND");
    }

    res.json(mapGoalRow(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.delete("/goals/:goalId", async (req, res, next) => {
  try {
    const goalId = String(req.params.goalId);
    const result = await query(
      "DELETE FROM goals WHERE id = $1 AND user_id = $2",
      [goalId, req.user!.id],
    );
    if (result.rowCount === 0) {
      throw new AppError(404, "Goal not found.", "GOAL_NOT_FOUND");
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/chat/messages", async (req, res, next) => {
  try {
    const payload = sanitizeValue(req.body);
    const channelId = String(payload.channelId || "");
    const channel = await query(
      `SELECT c.id FROM channels c
       JOIN groups g ON g.id = c.group_id
       LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2
       WHERE c.id = $1 AND (g.user_id = $2 OR g.user_id IS NULL OR gm.user_id IS NOT NULL)`,
      [channelId, req.user!.id],
    );
    if (!channel.rowCount) {
      res
        .status(400)
        .json({ error: "Select a valid channel before sending a message." });
      return;
    }

    const id = String(payload.id || `msg_${makeId()}`);
    const createdAt = payload.createdAt || new Date().toISOString();
    const finalMessage = {
      id,
      channelId,
      userId: req.user!.id,
      userName: req.user!.name,
      userAvatar: payload.userAvatar || req.user!.avatarUrl || undefined,
      content: String(payload.content || "").slice(0, 5000),
      attachments: Array.isArray(payload.attachments)
        ? payload.attachments
        : [],
      taskRefId: payload.taskRefId || undefined,
      createdAt,
      updatedAt: createdAt,
    };

    await query(
      `INSERT INTO chat_messages (id, channel_id, user_id, user_name, user_avatar, content, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        finalMessage.id,
        finalMessage.channelId,
        finalMessage.userId,
        finalMessage.userName,
        finalMessage.userAvatar || null,
        finalMessage.content,
        {
          ...payload,
          id,
          channelId,
          userId: req.user!.id,
          userName: req.user!.name,
          userAvatar: finalMessage.userAvatar || null,
          taskRefId: finalMessage.taskRefId,
        },
        finalMessage.createdAt,
      ],
    );

    await query(
      `INSERT INTO channel_messages (id, channel_id, sender_id, content, attachments, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        id,
        channelId,
        req.user!.id,
        finalMessage.content,
        finalMessage.attachments,
        {
          ...payload,
          id,
          channelId,
          senderId: req.user!.id,
          userName: req.user!.name,
          taskRefId: finalMessage.taskRefId,
        },
        createdAt,
        createdAt,
      ],
    );

    res.status(201).json(finalMessage);
  } catch (error) {
    next(error);
  }
});

workspaceRouter.get("/chat/messages", async (req, res, next) => {
  try {
    const channelId = req.query.channelId as string;
    if (!channelId) {
      res.status(400).json({ error: "channelId is required" });
      return;
    }

    const channel = await query(
      `SELECT c.id FROM channels c
       JOIN groups g ON g.id = c.group_id
       LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $2
       WHERE c.id = $1 AND (g.user_id = $2 OR g.user_id IS NULL OR gm.user_id IS NOT NULL)`,
      [channelId, req.user!.id],
    );
    if (!channel.rowCount) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const messages = await query(
      `SELECT msg.id,
              msg.channel_id,
              msg.user_id,
              msg.user_name,
              msg.user_avatar,
              msg.content,
              msg.attachments,
              msg.payload,
              msg.created_at,
              msg.updated_at
       FROM (
          SELECT cm.id,
                 cm.channel_id,
                 cm.sender_id::text AS user_id,
                 u.name AS user_name,
                 u.avatar_url AS user_avatar,
                 cm.content,
                 cm.attachments,
                 cm.payload,
                 cm.created_at,
                 cm.updated_at
          FROM channel_messages cm
          JOIN users u ON u.id = cm.sender_id
         UNION ALL
         SELECT chat.id,
                chat.channel_id,
                chat.user_id,
                chat.user_name,
                chat.user_avatar,
                chat.content,
                '[]'::jsonb AS attachments,
                '{}'::jsonb AS payload,
                chat.created_at,
                chat.created_at AS updated_at
         FROM chat_messages chat
         WHERE chat.id NOT IN (SELECT channel_messages.id FROM channel_messages)
       ) AS msg
       WHERE msg.channel_id = $1
       ORDER BY msg.created_at ASC
       LIMIT 100`,
      [channelId],
    );

    res.json(messages.rows.map(mapChatMessageRow));
  } catch (error) {
    next(error);
  }
});

workspaceRouter.delete("/channels/:channelId", async (req, res, next) => {
  try {
    const { channelId } = req.params;

    await query("DELETE FROM channel_messages WHERE channel_id = $1", [
      channelId,
    ]);

    await query("DELETE FROM channel_members WHERE channel_id = $1", [
      channelId,
    ]);

    await query("DELETE FROM channels WHERE id = $1", [channelId]);

    res.json({ success: true });
    return;
  } catch (error) {
    next(error);
  }
});

workspaceRouter.delete("/groups/:groupId", async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const channels = await query(
      "SELECT id FROM channels WHERE group_id = $1",
      [groupId],
    );

    for (const channel of channels.rows) {
      await query("DELETE FROM channel_messages WHERE channel_id = $1", [
        channel.id,
      ]);

      await query("DELETE FROM channel_members WHERE channel_id = $1", [
        channel.id,
      ]);
    }

    await query("DELETE FROM channels WHERE group_id = $1", [groupId]);

    await query("DELETE FROM group_members WHERE group_id = $1", [groupId]);

    await query("DELETE FROM groups WHERE id = $1", [groupId]);

    res.json({ success: true });
    return;
  } catch (error) {
    next(error);
  }
});

workspaceRouter.delete("/chat/messages/:messageId", async (req, res, next) => {
  try {
    const messageId = req.params.messageId;

    const message = await query(
      `SELECT sender_id FROM channel_messages WHERE id = $1
       UNION ALL
       SELECT user_id FROM chat_messages WHERE id = $1`,
      [messageId],
    );

    if (!message.rowCount) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    if (
      message.rows[0].sender_id !== req.user!.id &&
      message.rows[0].user_id !== req.user!.id
    ) {
      res.status(403).json({ error: "You can only delete your own messages" });
      return;
    }

    await query("DELETE FROM chat_messages WHERE id = $1", [messageId]);
    await query("DELETE FROM channel_messages WHERE id = $1", [messageId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.patch("/chat/messages/:messageId", async (req, res, next) => {
  try {
    const { content } = req.body;

    await query(
      `
        UPDATE channel_messages
        SET content = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
      [content, req.params.messageId],
    );

    await query(
      `
        UPDATE chat_messages
        SET content = $1
        WHERE id = $2
        `,
      [content, req.params.messageId],
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

workspaceRouter.post("/attachments/upload", (req, res) => {
  const payload = sanitizeValue(req.body);
  res.json({
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fileName: payload.fileName,
    fileSize: payload.fileSize || 1024,
    fileType: payload.fileType || "application/octet-stream",
    fileUrl: payload.dataUrl || "",
    uploadedAt: new Date().toISOString(),
  });
});
