import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder } from '@taleorience/domain';
export type TransactionContext = any;
export interface UnitOfWork {
    execute<T>(callback: (trx: TransactionContext) => Promise<T>): Promise<T>;
}
export interface ProjectRepository {
    findById(id: Guid, trx?: TransactionContext): Promise<Project | null>;
    findAll(trx?: TransactionContext): Promise<Project[]>;
    save(project: Project, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export interface GameObjectRepository {
    findById(id: Guid, trx?: TransactionContext): Promise<GameObject | null>;
    findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<GameObject[]>;
    save(entity: GameObject, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export interface PageRepository {
    findById(id: Guid, trx?: TransactionContext): Promise<Page | null>;
    findByGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Page[]>;
    save(entity: Page, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export interface BlockRepository {
    findById(id: Guid, trx?: TransactionContext): Promise<Block | null>;
    findByPageId(pageId: Guid, trx?: TransactionContext): Promise<Block[]>;
    save(entity: Block, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export interface AssetRepository {
    findById(id: Guid, trx?: TransactionContext): Promise<Asset | null>;
    findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Asset[]>;
    findByFolderId(folderId: Guid, trx?: TransactionContext): Promise<Asset[]>;
    save(asset: Asset, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
    incrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void>;
    decrementUsageCount(id: Guid, trx?: TransactionContext): Promise<void>;
}
export interface AssetFolderRepository {
    findById(id: Guid, trx?: TransactionContext): Promise<AssetFolder | null>;
    findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]>;
    findByParentId(parentId: Guid | null, projectId: Guid, trx?: TransactionContext): Promise<AssetFolder[]>;
    save(folder: AssetFolder, trx?: TransactionContext): Promise<void>;
    delete(id: Guid, trx?: TransactionContext): Promise<void>;
}
export interface UploadedFile {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
}
export interface FileStorage {
    save(file: UploadedFile, path: string): Promise<string>;
    get(path: string): Promise<Buffer>;
    delete(path: string): Promise<void>;
    exists(path: string): Promise<boolean>;
}
export interface ThumbnailGenerator {
    generate(imageBuffer: Buffer, width: number, height: number): Promise<Buffer>;
}
//# sourceMappingURL=ports.d.ts.map