-- Add invite_links table for group invitations
CREATE TABLE IF NOT EXISTS invite_links (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON invite_links(token);
CREATE INDEX IF NOT EXISTS idx_invite_links_group_id ON invite_links(group_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_is_active ON invite_links(is_active);
