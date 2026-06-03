const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log("Testing connection...");
    const res = await pool.query("SELECT NOW()");
    console.log("Connected successfully:", res.rows[0]);

    // Test the /api/db queries
    const userId = '00000000-0000-0000-0000-000000000000'; // dummy UUID for testing queries syntax

    console.log("Testing tasks query...");
    await pool.query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC", [userId]);

    console.log("Testing groups query...");
    await pool.query(
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
      [userId]
    );

    console.log("Testing channels query...");
    await pool.query(
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
      [userId]
    );

    console.log("Testing chatMessages query...");
    await pool.query(
      `SELECT m.id, m.channel_id, m.user_id, m.user_name, m.user_avatar, m.content, m.attachments, m.payload, m.created_at, m.updated_at
    FROM (
      SELECT cm.id, cm.channel_id, cm.sender_id::text AS user_id, u.name AS user_name, u.avatar_url AS user_avatar,
             cm.content, cm.attachments, cm.payload, cm.created_at, cm.updated_at
      FROM channel_messages cm
      JOIN users u ON u.id = cm.sender_id
      UNION ALL
      SELECT id, channel_id, user_id, user_name, user_avatar, content, '[]'::jsonb AS attachments,
             '{}'::jsonb AS payload, created_at, created_at AS updated_at
      FROM chat_messages
      WHERE id NOT IN (SELECT id FROM channel_messages)
    ) AS m
    JOIN channels c ON c.id = m.channel_id
    JOIN groups g ON g.id = c.group_id
    LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
    WHERE g.user_id = $1 OR g.user_id IS NULL OR gm.user_id IS NOT NULL
    ORDER BY m.created_at DESC
    LIMIT 50`,
      [userId]
    );

    console.log("All /api/db queries checked successfully!");
  } catch (err) {
    console.error("DB Query error found:", err);
  } finally {
    await pool.end();
  }
}

run();
