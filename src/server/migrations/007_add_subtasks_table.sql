DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subtasks'
  ) THEN
    CREATE TABLE subtasks (
      id TEXT PRIMARY KEY,
      parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      sort_order INTEGER DEFAULT 0
    );
  END IF;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END$$;

CREATE INDEX IF NOT EXISTS idx_subtasks_parent_sort ON subtasks(parent_task_id, sort_order);
