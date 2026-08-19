import { eq, and, isNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema-pg';
import {
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository,
  TransactionContext, UnitOfWork, AssetRepository, AssetFolderRepository
} from '@taleorience/application';
import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder } from '@taleorience/domain';
import { mapProject, mapGameObject, mapPage, mapBlock, mapAsset, mapAssetFolder } from './mappers';

export type PgDb = PostgresJsDatabase<typeof schema>;

export class PgUnitOfWork implements UnitOfWork {
  constructor(private readonly db: PgDb) {}
  async execute<T>(callback: (trx: TransactionContext) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => callback(tx));
  }
}

export class PgProjectRepository implements ProjectRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Project | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).execute();
    return rows[0] ? mapProject(rows[0]) : null;
  }
  async findAll(trx?: TransactionContext): Promise<Project[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.projects).execute();
    return rows.map(mapProject);
  }
  async save(project: Project, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.projects).values({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.projects.id,
      set: {
        name: project.name,
        description: project.description,
        updatedAt: project.updatedAt.toISOString(),
      }
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.projects).where(eq(schema.projects.id, id)).execute();
  }
}

export class PgGameObjectRepository implements GameObjectRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<GameObject | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.gameObjects).where(eq(schema.gameObjects.id, id)).execute();
    return rows[0] ? mapGameObject(rows[0]) : null;
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<GameObject[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.gameObjects).where(eq(schema.gameObjects.projectId, projectId)).execute();
    return rows.map(mapGameObject);
  }
  async save(entity: GameObject, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.gameObjects).values({
      ...entity,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.gameObjects.id,
      set: { name: entity.name, parentId: entity.parentId, updatedAt: entity.updatedAt.toISOString() }
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.gameObjects).where(eq(schema.gameObjects.id, id)).execute();
  }
}

export class PgPageRepository implements PageRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Page | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.pages).where(eq(schema.pages.id, id)).execute();
    return rows[0] ? mapPage(rows[0]) : null;
  }
  async findByGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Page[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.pages).where(eq(schema.pages.gameObjectId, gameObjectId)).execute();
    return rows.map(mapPage);
  }
  async save(entity: Page, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.pages).values({
      ...entity,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.pages.id,
      set: { title: entity.title, updatedAt: entity.updatedAt.toISOString() }
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.pages).where(eq(schema.pages.id, id)).execute();
  }
}

export class PgBlockRepository implements BlockRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Block | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.blocks).where(eq(schema.blocks.id, id)).execute();
    return rows[0] ? mapBlock(rows[0]) : null;
  }
  async findByPageId(pageId: Guid, trx?: TransactionContext): Promise<Block[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.blocks).where(eq(schema.blocks.pageId, pageId)).execute();
    return rows.map(mapBlock);
  }
  async save(entity: Block, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.blocks).values({
      ...entity,
      dataJson: JSON.stringify(entity.data),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.blocks.id,
      set: { dataJson: JSON.stringify(entity.data), updatedAt: entity.updatedAt.toISOString() }
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.blocks).where(eq(schema.blocks.id, id)).execute();
  }
}

export class PgAssetRepository implements AssetRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Asset | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).execute();
    return rows[0] ? mapAsset(rows[0]) : null;
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Asset[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.assets).where(eq(schema.assets.projectId, projectId)).execute();
    return rows.map(mapAsset);
  }
  async findByFolderId(folderId: Guid, trx?: TransactionContext): Promise<Asset[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.assets).where(eq(schema.assets.folderId, folderId)).execute();
    return rows.map(mapAsset);
  }
  async save(asset: Asset, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.assets).values({
      ...asset,
      metadataJson: JSON.stringify(asset.metadata),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.assets.id,
      set: {
        folderId: asset.folderId,
        type: asset.type,
        path: asset.path,
        mimeType: asset.mimeType,
        size: asset.size,
        width: asset.width,
        height: asset.height,
        metadataJson: JSON.stringify(asset.metadata),
        usageCount: asset.usageCount,
        updatedAt: asset.updatedAt.toISOString(),
      }
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.assets).where(eq(schema.assets.id, id)).execute();
  }
  async incrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).execute();
    if (rows[0]) {
      await db.update(schema.assets).set({
        usageCount: rows[0].usageCount + 1,
        updatedAt: new Date().toISOString()
      }).where(eq(schema.assets.id, id)).execute();
    }
  }
  async decrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).execute();
    if (rows[0]) {
      await db.update(schema.assets).set({
        usageCount: Math.max(0, rows[0].usageCount - 1),
        updatedAt: new Date().toISOString()
      }).where(eq(schema.assets.id, id)).execute();
    }
  }
}

export class PgAssetFolderRepository implements AssetFolderRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<AssetFolder | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.assetFolders).where(eq(schema.assetFolders.id, id)).execute();
    return rows[0] ? mapAssetFolder(rows[0]) : null;
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.assetFolders).where(eq(schema.assetFolders.projectId, projectId)).execute();
    return rows.map(mapAssetFolder);
  }
  async findByParentId(parentId: Guid | null, projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]> {
    const db = trx ?? this.db;
    const condition = parentId === null
      ? and(eq(schema.assetFolders.projectId, projectId), isNull(schema.assetFolders.parentId))
      : and(eq(schema.assetFolders.projectId, projectId), eq(schema.assetFolders.parentId, parentId));
    const rows = await db.select().from(schema.assetFolders).where(condition).execute();
    return rows.map(mapAssetFolder);
  }
  async save(folder: AssetFolder, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.assetFolders).values({
      ...folder,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.assetFolders.id,
      set: {
        parentId: folder.parentId,
        name: folder.name,
        updatedAt: folder.updatedAt.toISOString(),
      }
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.assetFolders).where(eq(schema.assetFolders.id, id)).execute();
  }
}