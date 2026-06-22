-- Add reply_to_message_id column to chat_messages table
-- This allows users to reply to specific messages in chat

ALTER TABLE chat_messages
ADD COLUMN reply_to_message_id TEXT;

-- Create index for faster lookups of reply chains
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_message_id
ON chat_messages(reply_to_message_id);
