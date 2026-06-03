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
    console.log("Locating a user and a channel...");
    const userRes = await pool.query("SELECT id, name FROM users LIMIT 1");
    if (!userRes.rowCount) {
      console.log("No users found. Cannot run post message test.");
      return;
    }
    const user = userRes.rows[0];
    console.log("Found user:", user.name, "id:", user.id);

    const channelRes = await pool.query("SELECT id FROM channels LIMIT 1");
    if (!channelRes.rowCount) {
      console.log("No channels found. Cannot run post message test.");
      return;
    }
    const channelId = channelRes.rows[0].id;
    console.log("Found channel:", channelId);

    const messageId = 'test_msg_' + Date.now();
    const createdAt = new Date().toISOString();

    console.log("Inserting test message into chat_messages and channel_messages...");
    await pool.query(
      `INSERT INTO chat_messages (id, channel_id, user_id, user_name, user_avatar, content, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        messageId,
        channelId,
        user.id,
        user.name,
        null,
        "Test message content",
        JSON.stringify({ text: "test" }),
        createdAt
      ]
    );

    await pool.query(
      `INSERT INTO channel_messages (id, channel_id, sender_id, content, attachments, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        messageId,
        channelId,
        user.id,
        "Test message content",
        JSON.stringify([]),
        JSON.stringify({ text: "test" }),
        createdAt,
        createdAt
      ]
    );

    console.log("Inserted message successfully!");

    // Query messages to make sure UNION queries succeed
    console.log("Querying messages using union query...");
    const messagesRes = await pool.query(
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
      [channelId]
    );

    console.log(`Successfully retrieved ${messagesRes.rows.length} messages!`);

    // Clean up test message
    console.log("Cleaning up test message...");
    await pool.query("DELETE FROM channel_messages WHERE id = $1", [messageId]);
    await pool.query("DELETE FROM chat_messages WHERE id = $1", [messageId]);
    console.log("Cleaned up successfully!");

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await pool.end();
  }
}

run();
