import pg from "pg";
import type { QueryResultRow } from "pg";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { config } from "./config";
import { logger } from "./logger";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

type Migration = {
  id: number;
  name: string;
  sql: string;
};

function loadSqlMigrations(): Migration[] {
  const migrationsDir = path.resolve(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .map((file) => {
      const match = file.match(/^(\d+)_([\w-]+)\.sql$/);
      if (!match) {
        throw new Error(`Invalid migration filename: ${file}`);
      }
      const id = Number(match[1]);
      const name = match[2];
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      return { id, name, sql };
    })
    .sort((a, b) => a.id - b.id);
}

const migrations: Migration[] = [
  {
    id: 1,
    name: "core_users_tasks",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar_url TEXT,
        oauth_provider TEXT NOT NULL DEFAULT 'local',
        oauth_provider_id TEXT,
        password_hash TEXT,
        reset_password_token_hash TEXT,
        reset_password_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
        priority TEXT NOT NULL DEFAULT 'medium'
          CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        due_date TIMESTAMPTZ,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_status_created ON tasks(user_id, status, created_at DESC);
    `,
  },
  {
    id: 2,
    name: "workspace_compatibility_tables",
    sql: `
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at);
    `,
  },
  {
    id: 3,
    name: "normalized_chat_workspace",
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT,
        ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (group_id, name)
      );

      CREATE TABLE IF NOT EXISTS channel_members (
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_read_at TIMESTAMPTZ,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (channel_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS channel_messages (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    id: 4,
    name: "group_membership_profiles",
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS timezone TEXT,
        ADD COLUMN IF NOT EXISTS notification_preferences JSONB
          DEFAULT '{"email": true, "mentions": true, "tasks": true}'::jsonb,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

      ALTER TABLE groups
        ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS name TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS color TEXT,
        ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private',
        ADD COLUMN IF NOT EXISTS avatar_url TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (group_id, user_id)
      );
    `,
  },
  {
    id: 5,
    name: "normalize_goals",
    sql: `
      ALTER TABLE goals
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS target_date TEXT,
        ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS linked_task_ids TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    `,
  },
  {
    id: 6,
    name: "add_tags_and_subtasks_tables",
    sql: `
      ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY,
        parent_task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_subtasks_parent 
        ON subtasks(parent_task_id);
    `,
  },
];

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  return pool.query<T>(text, params);
}

export async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const fileMigrations = loadSqlMigrations();
    const allMigrations = [...migrations, ...fileMigrations].sort(
      (a, b) => a.id - b.id,
    );

    for (const migration of allMigrations) {
      const applied = await client.query(
        "SELECT id FROM schema_migrations WHERE id = $1",
        [migration.id],
      );

      if (applied.rowCount) continue;

      logger.info("Applying database migration", {
        migration: migration.name,
      });

      await client.query(migration.sql);
      await client.query(
        "INSERT INTO schema_migrations (id, name) VALUES ($1, $2)",
        [migration.id, migration.name],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export const defaultGroups = [
  {
    id: "group_personal",
    name: "Personal Workspace",
    color: "#00C48C",
    description:
      "Your default NewDay workspace.",
    memberIds: [],
    ownerId: null,
    visibility: "private",
    avatarUrl: null,
    createdAt: new Date(0).toISOString(),
  },
];

export const defaultChannels = [
  {
    id: "chan_general",
    groupId: "group_personal",
    name: "general",
    description: "Team-wide updates and daily coordination.",
    createdBy: null,
    createdAt: new Date(0).toISOString(),
  },
];

export function makeId() {
  return randomUUID();
}
