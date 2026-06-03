DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
  ) THEN
    CREATE TABLE chat_messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_avatar TEXT,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;

  ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS channel_id TEXT,
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS user_avatar TEXT,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ALTER COLUMN created_at SET DEFAULT NOW();

  ALTER TABLE chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

  ALTER TABLE chat_messages
    ALTER COLUMN user_id TYPE TEXT USING user_id::text;

  UPDATE chat_messages
  SET
    channel_id = COALESCE(channel_id, payload->>'channelId'),
    user_id = COALESCE(user_id, payload->>'userId'),
    user_name = COALESCE(user_name, payload->>'userName'),
    user_avatar = COALESCE(user_avatar, payload->>'userAvatar'),
    content = COALESCE(content, payload->>'content'),
    created_at = COALESCE(
      NULLIF(payload->>'createdAt','')::timestamptz,
      created_at
    )
  WHERE payload IS NOT NULL;

EXCEPTION WHEN undefined_column THEN
  -- Some legacy chat_messages tables may not have payload; ignore if the column is absent.
  NULL;
END$$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created ON chat_messages(channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created_at ON chat_messages(user_id, created_at);
