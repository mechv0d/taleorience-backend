import { eq, and, isNull } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import {
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository,
  TransactionContext, UnitOfWork, AssetRepository, AssetFolderRepository
} from '@taleorience/application';
import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder } from '@taleorience/domain';
import { mapProject, mapGameObject, mapPage, mapBlock, mapAsset, mapAssetFolder } from './mappers';

export type Db = BetterSQLite3Database<typeof schema>;

// --- Unit of Work ---
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Db) {}
  async execute<T>(callback: (trx: TransactionContext) => Promise<T>): Promise<T> {
    return callback(this.db);
  }
}

// --- Implementations ---
export class SqlProjectRepository implements ProjectRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid): Promise<Project | null> {
    const res = await this.db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
    return res ? mapProject(res) : null;
  }
  async findAll(): Promise<Project[]> {
    const res = await this.db.select().from(schema.projects).all();
    return res.map(mapProject);
  }
  async save(project: Project): Promise<void> {
    await this.db.insert(schema.projects).values({
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
    });
  }
  async delete(id: Guid): Promise<void> {
    await this.db.delete(schema.projects).where(eq(schema.projects.id, id));
  }
}

export class SqlGameObjectRepository implements GameObjectRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid): Promise<GameObject | null> {
    const res = await this.db.select().from(schema.gameObjects).where(eq(schema.gameObjects.id, id)).get();
    return res ? mapGameObject(res) : null;
  }
  async findByProjectId(projectId: Guid): Promise<GameObject[]> {
    const res = await this.db.select().from(schema.gameObjects).where(eq(schema.gameObjects.projectId, projectId)).all();
    return res.map(mapGameObject);
  }
  async save(entity: GameObject): Promise<void> {
    await this.db.insert(schema.gameObjects).values({
      ...entity,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.gameObjects.id,
      set: { name: entity.name, parentId: entity.parentId, updatedAt: entity.updatedAt.toISOString() }
    });
  }
  async delete(id: Guid): Promise<void> {
    await this.db.delete(schema.gameObjects).where(eq(schema.gameObjects.id, id));
  }
}

export class SqlPageRepository implements PageRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid): Promise<Page | null> {
    const res = await this.db.select().from(schema.pages).where(eq(schema.pages.id, id)).get();
    return res ? mapPage(res) : null;
  }
  async findByGameObjectId(gameObjectId: Guid): Promise<Page[]> {
    const res = await this.db.select().from(schema.pages).where(eq(schema.pages.gameObjectId, gameObjectId)).all();
    return res.map(mapPage);
  }
  async save(entity: Page): Promise<void> {
    await this.db.insert(schema.pages).values({
      ...entity,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.pages.id,
      set: { title: entity.title, updatedAt: entity.updatedAt.toISOString() }
    });
  }
  async delete(id: Guid): Promise<void> {
    await this.db.delete(schema.pages).where(eq(schema.pages.id, id));
  }
}

export class SqlBlockRepository implements BlockRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid): Promise<Block | null> {
    const res = await this.db.select().from(schema.blocks).where(eq(schema.blocks.id, id)).get();
    return res ? mapBlock(res) : null;
  }
  async findByPageId(pageId: Guid): Promise<Block[]> {
    const res = await this.db.select().from(schema.blocks).where(eq(schema.blocks.pageId, pageId)).all();
    return res.map(mapBlock);
  }
  async save(entity: Block): Promise<void> {
    await this.db.insert(schema.blocks).values({
      ...entity,
      dataJson: JSON.stringify(entity.data),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.blocks.id,
      set: { dataJson: JSON.stringify(entity.data), updatedAt: entity.updatedAt.toISOString() }
    });
  }
  async delete(id: Guid): Promise<void> {
    await this.db.delete(schema.blocks).where(eq(schema.blocks.id, id));
  }
}

export class SqlAssetRepository implements AssetRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Asset | null> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).get();
    return res ? mapAsset(res) : null;
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Asset[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.assets).where(eq(schema.assets.projectId, projectId)).all();
    return res.map(mapAsset);
  }
  async findByFolderId(folderId: Guid, trx?: TransactionContext): Promise<Asset[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.assets).where(eq(schema.assets.folderId, folderId)).all();
    return res.map(mapAsset);
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
    });
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.assets).where(eq(schema.assets.id, id));
  }
  async incrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    const current = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).get();
    if (current) {
      await db.update(schema.assets).set({ 
        usageCount: current.usageCount + 1,
        updatedAt: new Date().toISOString() 
      }).where(eq(schema.assets.id, id));
    }
  }
  async decrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    const current = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).get();
    if (current) {
      await db.update(schema.assets).set({ 
        usageCount: Math.max(0, current.usageCount - 1),
        updatedAt: new Date().toISOString() 
      }).where(eq(schema.assets.id, id));
    }
  }
}

export class SqlAssetFolderRepository implements AssetFolderRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<AssetFolder | null> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.assetFolders).where(eq(schema.assetFolders.id, id)).get();
    return res ? mapAssetFolder(res) : null;
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.assetFolders).where(eq(schema.assetFolders.projectId, projectId)).all();
    return res.map(mapAssetFolder);
  }
  async findByParentId(parentId: Guid | null, projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]> {
    const db = trx ?? this.db;
    const condition = parentId === null 
      ? and(eq(schema.assetFolders.projectId, projectId), isNull(schema.assetFolders.parentId))
      : and(eq(schema.assetFolders.projectId, projectId), eq(schema.assetFolders.parentId, parentId));
    const res = await db.select().from(schema.assetFolders).where(condition).all();
    return res.map(mapAssetFolder);
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
    });
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.assetFolders).where(eq(schema.assetFolders.id, id));
  }
}
