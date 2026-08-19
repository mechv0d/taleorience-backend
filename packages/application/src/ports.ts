import { Project, GameObject, Page, Block, Guid, Asset, AssetFolder, Tag, GameObjectTag, Relation, Reference } from '@taleorience/domain';

export type TransactionContext = any; // Специфичный для инфраструктуры тип транзакции

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
  findByName(projectId: Guid, name: string, trx?: TransactionContext): Promise<GameObject | null>;
  searchByName(projectId: Guid, query: string, limit?: number, trx?: TransactionContext): Promise<GameObject[]>;
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

export interface TagRepository {
  findById(id: Guid, trx?: TransactionContext): Promise<Tag | null>;
  findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Tag[]>;
  findByNames(projectId: Guid, names: string[], trx?: TransactionContext): Promise<Tag[]>;
  save(tag: Tag, trx?: TransactionContext): Promise<void>;
  delete(id: Guid, trx?: TransactionContext): Promise<void>;
}

export interface GameObjectTagRepository {
  findByGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]>;
  findByTagId(tagId: Guid, trx?: TransactionContext): Promise<GameObjectTag[]>;
  add(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void>;
  remove(gameObjectId: Guid, tagId: Guid, trx?: TransactionContext): Promise<void>;
}

export interface RelationRepository {
  findById(id: Guid, trx?: TransactionContext): Promise<Relation | null>;
  findBySourceGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]>;
  findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Relation[]>;
  findByProjectId(projectId: Guid, trx?: TransactionContext): Promise<Relation[]>;
  save(relation: Relation, trx?: TransactionContext): Promise<void>;
  delete(id: Guid, trx?: TransactionContext): Promise<void>;
}

export interface ReferenceRepository {
  findBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<Reference[]>;
  findByTargetGameObjectId(gameObjectId: Guid, trx?: TransactionContext): Promise<Reference[]>;
  deleteBySourceBlockId(blockId: Guid, trx?: TransactionContext): Promise<void>;
  save(reference: Reference, trx?: TransactionContext): Promise<void>;
}

export interface SearchIndexEntry {
  id: Guid;
  projectId: Guid;
  entityType: 'gameObject' | 'page' | 'block';
  entityId: Guid;
  text: string;
}

export interface SearchIndexRepository {
  index(entries: SearchIndexEntry[], trx?: TransactionContext): Promise<void>;
  deleteByEntityId(entityId: Guid, trx?: TransactionContext): Promise<void>;
  search(projectId: Guid, query: string, limit?: number, trx?: TransactionContext): Promise<SearchIndexEntry[]>;
}