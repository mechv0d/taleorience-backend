import { 
  Project, GameObject, Page, Block, BlockType, Guid, generateGuid, DomainError 
} from '@taleorience/domain';
import { 
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, UnitOfWork 
} from './ports';

// --- PROJECTS ---
export class CreateProjectUseCase {
  constructor(private readonly repo: ProjectRepository, private readonly uow: UnitOfWork) {}
  async execute(name: string, description: string): Promise<Project> {
    return this.uow.execute(async (trx) => {
      const now = new Date();
      const project: Project = {
        id: generateGuid(), name, description,
        bannerAssetId: null, isExample: false, isReadOnly: false,
        createdAt: now, updatedAt: now,
      };
      await this.repo.save(project, trx);
      return project;
    });
  }
}

export class GetProjectUseCase {
  constructor(private readonly repo: ProjectRepository) {}
  async execute(id: Guid): Promise<Project> {
    const project = await this.repo.findById(id);
    if (!project) throw new DomainError('PROJECT_NOT_FOUND', 'errors.projectNotFound', { id }, 404);
    return project;
  }
}

export class ListProjectsUseCase {
  constructor(private readonly repo: ProjectRepository) {}
  execute(): Promise<Project[]> { return this.repo.findAll(); }
}

export class DeleteProjectUseCase {
  constructor(private readonly repo: ProjectRepository, private readonly uow: UnitOfWork) {}
  async execute(id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const exists = await this.repo.findById(id, trx);
      if (!exists) throw new DomainError('PROJECT_NOT_FOUND', 'errors.projectNotFound', { id }, 404);
      await this.repo.delete(id, trx);
    });
  }
}

// --- GAME OBJECTS ---
export class CreateGameObjectUseCase {
  constructor(
    private readonly goRepo: GameObjectRepository,
    private readonly pageRepo: PageRepository,
    private readonly uow: UnitOfWork
  ) {}
  
  async execute(projectId: Guid, name: string, parentId: Guid | null = null): Promise<GameObject> {
    return this.uow.execute(async (trx) => {
      const now = new Date();
      const gameObject: GameObject = {
        id: generateGuid(), projectId, parentId, name,
        icon: null, sortOrder: 0, createdAt: now, updatedAt: now,
      };
      await this.goRepo.save(gameObject, trx);

      // Бизнес-правило: При создании GameObject автоматически создается страница "Main"
      const mainPage: Page = {
        id: generateGuid(), projectId, gameObjectId: gameObject.id,
        title: 'Main', sortOrder: 0, createdAt: now, updatedAt: now,
      };
      await this.pageRepo.save(mainPage, trx);

      return gameObject;
    });
  }
}

export class DeleteGameObjectUseCase {
  constructor(
    private readonly goRepo: GameObjectRepository,
    private readonly pageRepo: PageRepository,
    private readonly blockRepo: BlockRepository,
    private readonly uow: UnitOfWork
  ) {}

  async execute(id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const go = await this.goRepo.findById(id, trx);
      if (!go) throw new DomainError('GAME_OBJECT_NOT_FOUND', 'errors.gameObjectNotFound', { id }, 404);

      // Каскадное удаление через Application Layer (соблюдаем правило "Domain owns mutations")
      const pages = await this.pageRepo.findByGameObjectId(id, trx);
      for (const page of pages) {
        const blocks = await this.blockRepo.findByPageId(page.id, trx);
        for (const block of blocks) await this.blockRepo.delete(block.id, trx);
        await this.pageRepo.delete(page.id, trx);
      }
      await this.goRepo.delete(id, trx);
    });
  }
}

// --- BLOCKS ---
export class CreateBlockUseCase {
  constructor(private readonly repo: BlockRepository, private readonly uow: UnitOfWork) {}
  
  async execute(projectId: Guid, pageId: Guid, type: BlockType, data: Record<string, unknown>): Promise<Block> {
    this.validateBlockData(type, data);
    
    return this.uow.execute(async (trx) => {
      const now = new Date();
      const block: Block = {
        id: generateGuid(), projectId, pageId, type, data,
        sortOrder: 0, createdAt: now, updatedAt: now,
      };
      await this.repo.save(block, trx);
      return block;
    });
  }

  private validateBlockData(type: BlockType, data: Record<string, unknown>): void {
    if (type === BlockType.TEXT && typeof data.content !== 'string') {
      throw new DomainError('INVALID_BLOCK_DATA', 'errors.invalidBlockData', { type });
    }
  }
}

export class UpdateBlockUseCase {
  constructor(private readonly repo: BlockRepository, private readonly uow: UnitOfWork) {}
  async execute(id: Guid, data: Record<string, unknown>): Promise<Block> {
    return this.uow.execute(async (trx) => {
      const block = await this.repo.findById(id, trx);
      if (!block) throw new DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);
      
      this.validateBlockData(block.type, data);
      block.data = data;
      block.updatedAt = new Date();
      await this.repo.save(block, trx);
      return block;
    });
  }
  private validateBlockData(type: BlockType, data: Record<string, unknown>): void {
    if (type === BlockType.TEXT && typeof data.content !== 'string') {
      throw new DomainError('INVALID_BLOCK_DATA', 'errors.invalidBlockData', { type });
    }
  }
}