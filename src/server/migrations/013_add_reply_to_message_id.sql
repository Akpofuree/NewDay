-- Add reply_to_message_id column to channel_messages table
ALTER TABLE channel_messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT REFERENCES channel_messages(id) ON DELETE SET NULL;

-- Add reply_to_message_id column to chat_messages table  
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_channel_messages_reply_to ON channel_messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_message_id);
