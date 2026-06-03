const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/server/routes/workspace.ts');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = "      query(\n        `SELECT m.id, m.channel_id, m.user_id, m.user_name, m.user_avatar, m.content, m.attachments, m.payload, m.created_at, m.updated_at\n   FROM (\n     SELECT id, channel_id, sender_id AS user_id, sender_name AS user_name, NULL::text AS user_avatar,\n            content, attachments, payload, created_at, updated_at\n     FROM channel_messages\n     UNION ALL\n     SELECT id, channel_id, user_id, user_name, user_avatar, content, '[]'::jsonb AS attachments,\n            '{}'::jsonb AS payload, created_at, created_at AS updated_at\n     FROM chat_messages\n     WHERE id NOT IN (SELECT id FROM channel_messages)\n   ) AS m\n   JOIN channels c ON c.id = m.channel_id\n   JOIN groups g ON g.id = c.group_id\n   LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1\n   WHERE g.user_id = $1 OR g.user_id IS NULL OR gm.user_id IS NOT NULL\n   ORDER BY m.created_at DESC\n   LIMIT 50`,\n        [req.user!.id],\n      ),";

const replacementStr = "      query(\n        `SELECT m.id, m.channel_id, m.user_id, m.user_name, m.user_avatar, m.content, m.attachments, m.payload, m.created_at, m.updated_at\n   FROM (\n     SELECT cm.id, cm.channel_id, cm.sender_id::text AS user_id, u.name AS user_name, u.avatar_url AS user_avatar,\n            cm.content, cm.attachments, cm.payload, cm.created_at, cm.updated_at\n     FROM channel_messages cm\n     JOIN users u ON u.id = cm.sender_id\n     UNION ALL\n     SELECT id, channel_id, user_id, user_name, user_avatar, content, '[]'::jsonb AS attachments,\n            '{}'::jsonb AS payload, created_at, created_at AS updated_at\n     FROM chat_messages\n     WHERE id NOT IN (SELECT id FROM channel_messages)\n   ) AS m\n   JOIN channels c ON c.id = m.channel_id\n   JOIN groups g ON g.id = c.group_id\n   LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1\n   WHERE g.user_id = $1 OR g.user_id IS NULL OR gm.user_id IS NOT NULL\n   ORDER BY m.created_at DESC\n   LIMIT 50`,\n        [req.user!.id],\n      ),";

// Handle Windows CRLF line endings if present
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetStr.replace(/\r\n/g, '\n');
const normalizedReplacement = replacementStr.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  content = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  console.log("Successfully replaced first query!");
} else {
  console.log("Target query not found in normalized content!");
}

// Convert back to CRLF if the original file had CRLF
if (fs.readFileSync(filePath, 'utf8').includes('\r\n')) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("File saved!");
