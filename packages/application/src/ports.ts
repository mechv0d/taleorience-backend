import { Project, GameObject, Page, Block, Guid } from '@taleorience/domain';

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