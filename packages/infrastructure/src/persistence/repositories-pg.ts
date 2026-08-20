import { eq, and, isNull, like } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema-pg';
import {
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository,
  TransactionContext, UnitOfWork, AssetRepository, AssetFolderRepository,
  TagRepository, GameObjectTagRepository, RelationRepository, ReferenceRepository, SearchIndexRepository, SearchIndexEntry
} from '@taleorience/application';
import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder, Tag, GameObjectTag, Relation, Reference } from '@taleorience/domain';
import { mapProject, mapGameObject, mapPage, mapBlock, mapAsset, mapAssetFolder, mapTag, mapGameObjectTag, mapRelation, mapReference } from './mappers';

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
  async findByName(projectId: Guid, name: string, trx?: TransactionContext): Promise<GameObject | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.gameObjects).where(and(eq(schema.gameObjects.projectId, projectId), eq(schema.gameObjects.name, name))).execute();
    return rows[0] ? mapGameObject(rows[0]) : null;
  }
  async searchByName(projectId: Guid, query: string, limit = 20, trx?: TransactionContext): Promise<GameObject[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.gameObjects)
      .where(and(eq(schema.gameObjects.projectId, projectId), like(schema.gameObjects.name, `%${query}%`)))
      .limit(limit).execute();
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
      set: {
        dataJson: JSON.stringify(entity.data),
        sortOrder: entity.sortOrder,
        updatedAt: entity.updatedAt.toISOString(),
      }
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

export class PgTagRepository implements TagRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Tag | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.tags).where(eq(schema.tags.id, id)).execute();
    return rows[0] ? mapTag(rows[0]) : null;
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Tag[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.tags).where(eq(schema.tags.projectId, projectId)).execute();
    return rows.map(mapTag);
  }
  async findByNames(projectId: Guid, names: string[], trx?: TransactionContext): Promise<Tag[]> {
    if (names.length === 0) return [];
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.tags)
      .where(and(eq(schema.tags.projectId, projectId), ...names.map(n => eq(schema.tags.name, n))))
      .execute();
    return rows.map(mapTag);
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
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.tags).where(eq(schema.tags.id, id)).execute();
  }
}

export class PgGameObjectTagRepository implements GameObjectTagRepository {
  constructor(private readonly db: PgDb) {}
  async findByGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.gameObjectTags).where(eq(schema.gameObjectTags.gameObjectId, gameObjectId)).execute();
    return rows.map(mapGameObjectTag);
  }
  async findByTagId(tagId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.gameObjectTags).where(eq(schema.gameObjectTags.tagId, tagId)).execute();
    return rows.map(mapGameObjectTag);
  }
  async add(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.gameObjectTags).values({
      gameObjectId, tagId, createdAt: new Date().toISOString(),
    }).onConflictDoNothing().execute();
  }
  async remove(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.gameObjectTags).where(and(eq(schema.gameObjectTags.gameObjectId, gameObjectId), eq(schema.gameObjectTags.tagId, tagId))).execute();
  }
}

export class PgRelationRepository implements RelationRepository {
  constructor(private readonly db: PgDb) {}
  async findById(id: Guid, trx?: TransactionContext): Promise<Relation | null> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.relations).where(eq(schema.relations.id, id)).execute();
    return rows[0] ? mapRelation(rows[0]) : null;
  }
  async findBySourceGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.relations).where(eq(schema.relations.sourceGameObjectId, gameObjectId)).execute();
    return rows.map(mapRelation);
  }
  async findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.relations).where(eq(schema.relations.targetGameObjectId, gameObjectId)).execute();
    return rows.map(mapRelation);
  }
  async findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Relation[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.relations).where(eq(schema.relations.projectId, projectId)).execute();
    return rows.map(mapRelation);
  }
  async save(relation: Relation, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.relations).values({
      ...relation,
      createdAt: relation.createdAt.toISOString(),
    }).onConflictDoUpdate({
      target: schema.relations.id,
      set: { sourceGameObjectId: relation.sourceGameObjectId, targetGameObjectId: relation.targetGameObjectId, type: relation.type }
    }).execute();
  }
  async delete(id: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.relations).where(eq(schema.relations.id, id)).execute();
  }
}

export class PgReferenceRepository implements ReferenceRepository {
  constructor(private readonly db: PgDb) {}
  async findBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<Reference[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.markdownReferences).where(eq(schema.markdownReferences.sourceBlockId, blockId)).execute();
    return rows.map(mapReference);
  }
  async findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Reference[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.markdownReferences).where(eq(schema.markdownReferences.targetGameObjectId, gameObjectId)).execute();
    return rows.map(mapReference);
  }
  async deleteBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.markdownReferences).where(eq(schema.markdownReferences.sourceBlockId, blockId)).execute();
  }
  async save(reference: Reference, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.insert(schema.markdownReferences).values({
      ...reference,
      createdAt: reference.createdAt.toISOString(),
    }).onConflictDoNothing().execute();
  }
}

export class PgSearchIndexRepository implements SearchIndexRepository {
  constructor(private readonly db: PgDb) {}
  async index(entries: SearchIndexEntry[], trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    for (const entry of entries) {
      await db.insert(schema.searchIndex).values({
        id: entry.id, projectId: entry.projectId, entityType: entry.entityType,
        entityId: entry.entityId, text: entry.text,
      }).onConflictDoUpdate({
        target: schema.searchIndex.id,
        set: { text: entry.text }
      }).execute();
    }
  }
  async deleteByEntityId(entityId: Guid, trx?: TransactionContext): Promise<void> {
    const db = trx ?? this.db;
    await db.delete(schema.searchIndex).where(eq(schema.searchIndex.entityId, entityId)).execute();
  }
  async search(projectId: Guid, query: string, limit = 20, trx?: TransactionContext): Promise<SearchIndexEntry[]> {
    const db = trx ?? this.db;
    const rows = await db.select().from(schema.searchIndex)
      .where(and(eq(schema.searchIndex.projectId, projectId), like(schema.searchIndex.text, `%${query}%`)))
      .limit(limit).execute();
    return rows;
  }
}