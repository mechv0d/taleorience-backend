import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { 
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, 
  TransactionContext, UnitOfWork 
} from '@taleorience/application';
import { Project, GameObject, Page, Block, Guid, BlockType } from '@taleorience/domain';

type Db = BetterSQLite3Database<typeof schema>;

// --- Unit of Work ---
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Db) {}
  async execute<T>(callback: (trx: TransactionContext) => Promise<T>): Promise<T> {
    // В better-sqlite3 транзакции синхронные, но drizzle оборачивает их в async
    // Для E2E и MVP мы используем callback, передавая сам db как контекст
    return callback(this.db); 
  }
}

// --- Mappers ---
const mapProject = (row: typeof schema.projects.$inferSelect): Project => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

const mapGameObject = (row: typeof schema.gameObjects.$inferSelect): GameObject => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

const mapPage = (row: typeof schema.pages.$inferSelect): Page => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

const mapBlock = (row: typeof schema.blocks.$inferSelect): Block => ({
  id: row.id,
  projectId: row.projectId,
  pageId: row.pageId,
  type: row.type as BlockType, // <--- Явное приведение к enum
  data: JSON.parse(row.dataJson) as Record<string, unknown>, // <--- Приведение к нужному типу данных
  sortOrder: row.sortOrder,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

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