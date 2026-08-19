import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, TransactionContext, UnitOfWork, AssetRepository, AssetFolderRepository } from '@taleorience/application';
import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder } from '@taleorience/domain';
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
//# sourceMappingURL=repositories.d.ts.map