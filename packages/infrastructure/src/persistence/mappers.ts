import * as schema from './schema';
import { Project, GameObject, Page, Block, BlockType, Asset, AssetType, AssetFolder } from '@taleorience/domain';

type ProjectRow = typeof schema.projects.$inferSelect;
type GameObjectRow = typeof schema.gameObjects.$inferSelect;
type PageRow = typeof schema.pages.$inferSelect;
type BlockRow = typeof schema.blocks.$inferSelect;
type AssetRow = typeof schema.assets.$inferSelect;
type AssetFolderRow = typeof schema.assetFolders.$inferSelect;

export const mapProject = (row: ProjectRow): Project => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

export const mapGameObject = (row: GameObjectRow): GameObject => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

export const mapPage = (row: PageRow): Page => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

export const mapBlock = (row: BlockRow): Block => ({
  id: row.id,
  projectId: row.projectId,
  pageId: row.pageId,
  type: row.type as BlockType,
  data: JSON.parse(row.dataJson) as Record<string, unknown>,
  sortOrder: row.sortOrder,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

export const mapAsset = (row: AssetRow): Asset => ({
  id: row.id,
  projectId: row.projectId,
  folderId: row.folderId,
  type: row.type as AssetType,
  path: row.path,
  mimeType: row.mimeType,
  size: row.size,
  width: row.width,
  height: row.height,
  metadata: JSON.parse(row.metadataJson) as Record<string, unknown>,
  usageCount: row.usageCount,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

export const mapAssetFolder = (row: AssetFolderRow): AssetFolder => ({
  id: row.id,
  projectId: row.projectId,
  parentId: row.parentId,
  name: row.name,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});