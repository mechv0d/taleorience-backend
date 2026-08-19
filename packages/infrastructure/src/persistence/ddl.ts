export const SQLITE_SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    banner_asset_id TEXT, is_example INTEGER NOT NULL DEFAULT 0, is_read_only INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS game_objects (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parent_id TEXT, name TEXT NOT NULL,
    icon TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, game_object_id TEXT NOT NULL, title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, page_id TEXT NOT NULL, type TEXT NOT NULL,
    data_json TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, folder_id TEXT, type TEXT NOT NULL,
    path TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL,
    width INTEGER, height INTEGER, metadata_json TEXT NOT NULL DEFAULT '{}',
    usage_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS asset_folders (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parent_id TEXT, name TEXT NOT NULL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
`;

export const POSTGRES_SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    banner_asset_id TEXT, is_example BOOLEAN NOT NULL DEFAULT FALSE, is_read_only BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS game_objects (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parent_id TEXT, name TEXT NOT NULL,
    icon TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, game_object_id TEXT NOT NULL, title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, page_id TEXT NOT NULL, type TEXT NOT NULL,
    data_json TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, folder_id TEXT, type TEXT NOT NULL,
    path TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL,
    width INTEGER, height INTEGER, metadata_json TEXT NOT NULL DEFAULT '{}',
    usage_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS asset_folders (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parent_id TEXT, name TEXT NOT NULL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
`;