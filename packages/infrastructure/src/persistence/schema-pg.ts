import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  bannerAssetId: text('banner_asset_id'),
  isExample: boolean('is_example').notNull().default(false),
  isReadOnly: boolean('is_read_only').notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const gameObjects = pgTable('game_objects', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  gameObjectId: text('game_object_id').notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const blocks = pgTable('blocks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  pageId: text('page_id').notNull(),
  type: text('type').notNull(),
  dataJson: text('data_json').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const assets = pgTable('assets', {
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

export const assetFolders = pgTable('asset_folders', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});