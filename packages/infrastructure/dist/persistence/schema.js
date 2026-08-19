"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchIndex = exports.markdownReferences = exports.relations = exports.gameObjectTags = exports.tags = exports.assetFolders = exports.assets = exports.blocks = exports.pages = exports.gameObjects = exports.projects = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.projects = (0, sqlite_core_1.sqliteTable)('projects', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    description: (0, sqlite_core_1.text)('description').notNull().default(''),
    bannerAssetId: (0, sqlite_core_1.text)('banner_asset_id'),
    isExample: (0, sqlite_core_1.integer)('is_example', { mode: 'boolean' }).notNull().default(false),
    isReadOnly: (0, sqlite_core_1.integer)('is_read_only', { mode: 'boolean' }).notNull().default(false),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
exports.gameObjects = (0, sqlite_core_1.sqliteTable)('game_objects', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    parentId: (0, sqlite_core_1.text)('parent_id'),
    name: (0, sqlite_core_1.text)('name').notNull(),
    icon: (0, sqlite_core_1.text)('icon'),
    sortOrder: (0, sqlite_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
exports.pages = (0, sqlite_core_1.sqliteTable)('pages', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    gameObjectId: (0, sqlite_core_1.text)('game_object_id').notNull(),
    title: (0, sqlite_core_1.text)('title').notNull(),
    sortOrder: (0, sqlite_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
exports.blocks = (0, sqlite_core_1.sqliteTable)('blocks', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    pageId: (0, sqlite_core_1.text)('page_id').notNull(),
    type: (0, sqlite_core_1.text)('type').notNull(),
    dataJson: (0, sqlite_core_1.text)('data_json').notNull(),
    sortOrder: (0, sqlite_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
exports.assets = (0, sqlite_core_1.sqliteTable)('assets', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    folderId: (0, sqlite_core_1.text)('folder_id'),
    type: (0, sqlite_core_1.text)('type').notNull(),
    path: (0, sqlite_core_1.text)('path').notNull(),
    mimeType: (0, sqlite_core_1.text)('mime_type').notNull(),
    size: (0, sqlite_core_1.integer)('size').notNull(),
    width: (0, sqlite_core_1.integer)('width'),
    height: (0, sqlite_core_1.integer)('height'),
    metadataJson: (0, sqlite_core_1.text)('metadata_json').notNull().default('{}'),
    usageCount: (0, sqlite_core_1.integer)('usage_count').notNull().default(0),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
exports.assetFolders = (0, sqlite_core_1.sqliteTable)('asset_folders', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    parentId: (0, sqlite_core_1.text)('parent_id'),
    name: (0, sqlite_core_1.text)('name').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
exports.tags = (0, sqlite_core_1.sqliteTable)('tags', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull(),
});
exports.gameObjectTags = (0, sqlite_core_1.sqliteTable)('game_object_tags', {
    gameObjectId: (0, sqlite_core_1.text)('game_object_id').notNull(),
    tagId: (0, sqlite_core_1.text)('tag_id').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
}, (table) => [
    (0, sqlite_core_1.primaryKey)({ columns: [table.gameObjectId, table.tagId] }),
]);
exports.relations = (0, sqlite_core_1.sqliteTable)('relations', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    sourceGameObjectId: (0, sqlite_core_1.text)('source_game_object_id').notNull(),
    targetGameObjectId: (0, sqlite_core_1.text)('target_game_object_id').notNull(),
    type: (0, sqlite_core_1.text)('type').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
exports.markdownReferences = (0, sqlite_core_1.sqliteTable)('markdown_references', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    sourceBlockId: (0, sqlite_core_1.text)('source_block_id').notNull(),
    targetGameObjectId: (0, sqlite_core_1.text)('target_game_object_id').notNull(),
    label: (0, sqlite_core_1.text)('label'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull(),
});
exports.searchIndex = (0, sqlite_core_1.sqliteTable)('search_index', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    projectId: (0, sqlite_core_1.text)('project_id').notNull(),
    entityType: (0, sqlite_core_1.text)('entity_type').notNull(),
    entityId: (0, sqlite_core_1.text)('entity_id').notNull(),
    text: (0, sqlite_core_1.text)('text').notNull(),
});
//# sourceMappingURL=schema.js.map