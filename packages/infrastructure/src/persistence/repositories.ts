import { eq, and, isNull, like, desc } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import {
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository,
  TransactionContext, UnitOfWork, AssetRepository, AssetFolderRepository,
  TagRepository, GameObjectTagRepository, RelationRepository, ReferenceRepository, SearchIndexRepository, SearchIndexEntry
} from '@taleorience/application';
import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder, Tag, GameObjectTag, Relation, Reference } from '@taleorience/domain';
import { mapProject, mapGameObject, mapPage, mapBlock, mapAsset, mapAssetFolder, mapTag, mapGameObjectTag, mapRelation, mapReference } from './mappers';

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
  async findByName(projectId: Guid, name: string, trx?: TransactionContext): Promise<GameObject | null> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.gameObjects).where(and(eq(schema.gameObjects.projectId, projectId), eq(schema.gameObjects.name, name))).get();
    return res ? mapGameObject(res) : null;
  }
  async searchByName(projectId: Guid, query: string, limit = 20, trx?: TransactionContext): Promise<GameObject[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.gameObjects)
      .where(and(eq(schema.gameObjects.projectId, projectId), like(schema.gameObjects.name, `%${query}%`)))
      .limit(limit).all();
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
      set: {
        dataJson: JSON.stringify(entity.data),
        sortOrder: entity.sortOrder,
        updatedAt: entity.updatedAt.toISOString(),
      }
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

export class SqlTagRepository implements TagRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Tag | null> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.tags).where(eq(schema.tags.id, id)).get();
    return res ? mapTag(res) : null;
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Tag[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.tags).where(eq(schema.tags.projectId, projectId)).all();
    return res.map(mapTag);
  }
  async findByNames(projectId: Guid, names: string[], trx?: TransactionContext): Promise<Tag[]> {
    if (names.length === 0) return [];
    const db = trx ?? this.db;
    const res = await db.select().from(schema.tags)
      .where(and(eq(schema.tags.projectId, projectId), ...names.map(n => eq(schema.tags.name, n))))
      .all();
    return res.map(mapTag);
  }
  async save(tag: Tag, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.tags).values({
      ...tag,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.tags.id,
      set: { name: tag.name, updatedAt: tag.updatedAt.toISOString() }
    });
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.tags).where(eq(schema.tags.id, id));
  }
}

export class SqlGameObjectTagRepository implements GameObjectTagRepository {
  constructor(private readonly db: Db) {}
  async findByGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.gameObjectTags).where(eq(schema.gameObjectTags.gameObjectId, gameObjectId)).all();
    return res.map(mapGameObjectTag);
  }
  async findByTagId(tagId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.gameObjectTags).where(eq(schema.gameObjectTags.tagId, tagId)).all();
    return res.map(mapGameObjectTag);
  }
  async add(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.gameObjectTags).values({
      gameObjectId, tagId, createdAt: new Date().toISOString(),
    }).onConflictDoNothing();
  }
  async remove(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.gameObjectTags).where(and(eq(schema.gameObjectTags.gameObjectId, gameObjectId), eq(schema.gameObjectTags.tagId, tagId)));
  }
}

export class SqlRelationRepository implements RelationRepository {
  constructor(private readonly db: Db) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Relation | null> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.relations).where(eq(schema.relations.id, id)).get();
    return res ? mapRelation(res) : null;
  }
  async findBySourceGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.relations).where(eq(schema.relations.sourceGameObjectId, gameObjectId)).all();
    return res.map(mapRelation);
  }
  async findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.relations).where(eq(schema.relations.targetGameObjectId, gameObjectId)).all();
    return res.map(mapRelation);
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Relation[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.relations).where(eq(schema.relations.projectId, projectId)).all();
    return res.map(mapRelation);
  }
  async save(relation: Relation, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.relations).values({
      ...relation,
      createdAt: relation.createdAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.relations.id,
      set: { sourceGameObjectId: relation.sourceGameObjectId, targetGameObjectId: relation.targetGameObjectId, type: relation.type }
    });
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.relations).where(eq(schema.relations.id, id));
  }
}

export class SqlReferenceRepository implements ReferenceRepository {
  constructor(private readonly db: Db) {}
  async findBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<Reference[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.markdownReferences).where(eq(schema.markdownReferences.sourceBlockId, blockId)).all();
    return res.map(mapReference);
  }
  async findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Reference[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.markdownReferences).where(eq(schema.markdownReferences.targetGameObjectId, gameObjectId)).all();
    return res.map(mapReference);
  }
  async deleteBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.markdownReferences).where(eq(schema.markdownReferences.sourceBlockId, blockId));
  }
  async save(reference: Reference, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.markdownReferences).values({
      ...reference,
      createdAt: reference.createdAt.toISOString(),
    }).onConflictDoNothing();
  }
}

export class SqlSearchIndexRepository implements SearchIndexRepository {
  constructor(private readonly db: Db) {}
  async index(entries: SearchIndexEntry[], trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    for (const entry of entries) {
      await db.insert(schema.searchIndex).values({
        id: entry.id, projectId: entry.projectId, entityType: entry.entityType,
        entityId: entry.entityId, text: entry.text,
      }).onConflictDoUpdate({
        target: schema.searchIndex.id,
        set: { text: entry.text }
      });
    }
  }
  async deleteByEntityId(entityId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.searchIndex).where(eq(schema.searchIndex.entityId, entityId));
  }
  async search(projectId: Guid, query: string, limit = 20, trx?: TransactionContext): Promise<SearchIndexEntry[]> {
    const db = trx ?? this.db;
    const res = await db.select().from(schema.searchIndex)
      .where(and(eq(schema.searchIndex.projectId, projectId), like(schema.searchIndex.text, `%${query}%`)))
      .orderBy(desc(schema.searchIndex.text))
      .limit(limit).all();
    return res;
  }
}
