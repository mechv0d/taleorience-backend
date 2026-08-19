import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  bannerAssetId: text('banner_asset_id'),
  isExample: integer('is_example', { mode: 'boolean' }).notNull().default(false),
  isReadOnly: integer('is_read_only', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const gameObjects = sqliteTable('game_objects', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  gameObjectId: text('game_object_id').notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const blocks = sqliteTable('blocks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  pageId: text('page_id').notNull(),
  type: text('type').notNull(),
  dataJson: text('data_json').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  folderId: text('folder_id'),
  type: text('type').notNull(),
  path: text('path').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  metadataJson: text('metadata_json').notNull().default('{}'),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const assetFolders = sqliteTable('asset_folders', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});