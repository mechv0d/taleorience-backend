import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, TransactionContext, UnitOfWork, AssetRepository, AssetFolderRepository, TagRepository, GameObjectTagRepository, RelationRepository, ReferenceRepository, SearchIndexRepository, SearchIndexEntry } from '@taleorience/application';
import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder, Tag, GameObjectTag, Relation, Reference } from '@taleorience/domain';
export type Db = BetterSQLite3Database<typeof schema>;
export declare class DrizzleUnitOfWork implements UnitOfWork {
    private readonly db;
    constructor(db: Db);
    execute<T>(callback: (trx: TransactionContext) => Promise<T>): Promise<T>;
}
export declare class SqlProjectRepository implements ProjectRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid): Promise<Project | null>;
    findAll(): Promise<Project[]>;
    save(project: Project): Promise<void>;
    delete(id: Guid): Promise<void>;
}
export declare class SqlGameObjectRepository implements GameObjectRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid): Promise<GameObject | null>;
    findByProjectId(projectId: Guid): Promise<GameObject[]>;
    findByName(projectId: Guid, name: string, trx?: TransactionContext): Promise<GameObject | null>;
    searchByName(projectId: Guid, query: string, limit?: number, trx?: TransactionContext): Promise<GameObject[]>;
    save(entity: GameObject): Promise<void>;
    delete(id: Guid): Promise<void>;
}
export declare class SqlPageRepository implements PageRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid): Promise<Page | null>;
    findByGameObjectId(gameObjectId: Guid): Promise<Page[]>;
    save(entity: Page): Promise<void>;
    delete(id: Guid): Promise<void>;
}
export declare class SqlBlockRepository implements BlockRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid): Promise<Block | null>;
    findByPageId(pageId: Guid): Promise<Block[]>;
    save(entity: Block): Promise<void>;
    delete(id: Guid): Promise<void>;
}
export declare class SqlAssetRepository implements AssetRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid, trx?: TransactionContext): Promise<Asset | null>;
    findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Asset[]>;
    findByFolderId(folderId: Guid, trx?: TransactionContext): Promise<Asset[]>;
    save(asset: Asset, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
    incrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void>;
    decrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void>;
}
export declare class SqlAssetFolderRepository implements AssetFolderRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid, trx?: TransactionContext): Promise<AssetFolder | null>;
    findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]>;
    findByParentId(parentId: Guid | null, projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]>;
    save(folder: AssetFolder, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export declare class SqlTagRepository implements TagRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid, trx?: TransactionContext): Promise<Tag | null>;
    findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Tag[]>;
    findByNames(projectId: Guid, names: string[], trx?: TransactionContext): Promise<Tag[]>;
    save(tag: Tag, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export declare class SqlGameObjectTagRepository implements GameObjectTagRepository {
    private readonly db;
    constructor(db: Db);
    findByGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]>;
    findByTagId(tagId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]>;
    add(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void>;
    remove(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void>;
}
export declare class SqlRelationRepository implements RelationRepository {
    private readonly db;
    constructor(db: Db);
    findById(id: Guid, trx?: TransactionContext): Promise<Relation | null>;
    findBySourceGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]>;
    findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]>;
    findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Relation[]>;
    save(relation: Relation, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export declare class SqlReferenceRepository implements ReferenceRepository {
    private readonly db;
    constructor(db: Db);
    findBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<Reference[]>;
    findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Reference[]>;
    deleteBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<void>;
    save(reference: Reference, trx?: TransactionContext): Promise<void>;
}
export declare class SqlSearchIndexRepository implements SearchIndexRepository {
    private readonly db;
    constructor(db: Db);
    index(entries: SearchIndexEntry[], trx?: TransactionContext): Promise<void>;
    deleteByEntityId(entityId: Guid, trx?: TransactionContext): Promise<void>;
    search(projectId: Guid, query: string, limit?: number, trx?: TransactionContext): Promise<SearchIndexEntry[]>;
}
//# sourceMappingURL=repositories.d.ts.map