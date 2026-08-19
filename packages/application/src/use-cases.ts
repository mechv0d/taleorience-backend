import { Project, GameObject, Page, Block, BlockType, Guid, generateGuid, DomainError, Asset, AssetType, AssetFolder } from '@taleorience/domain';
import { 
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, UnitOfWork,
  AssetRepository, AssetFolderRepository, FileStorage, ThumbnailGenerator
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

// --- ASSETS ---
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'video/mp4', 'video/webm',
]);

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export class UploadAssetUseCase {
  constructor(
    private readonly assetRepo: AssetRepository,
    private readonly folderRepo: AssetFolderRepository,
    private readonly fileStorage: FileStorage,
    private readonly thumbnailGenerator: ThumbnailGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    projectId: Guid,
    file: { buffer: Buffer; originalName: string; mimeType: string; size: number },
    folderId: Guid | null = null,
  ): Promise<Asset> {
    this.validateFile(file);

    const sanitizedFileName = this.sanitizeFileName(file.originalName);
    const path = `projects/${projectId}/assets/${sanitizedFileName}`;

    let width: number | null = null;
    let height: number | null = null;
    let thumbnailPath: string | null = null;

    if (file.mimeType.startsWith('image/')) {
      const dimensions = await this.getImageDimensions(file.buffer);
      width = dimensions.width;
      height = dimensions.height;

      if (folderId) {
        const folder = await this.folderRepo.findById(folderId);
        if (folder && folder.projectId !== projectId) {
          throw new DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { folderId }, 403);
        }
      }

      const thumbnailBuffer = await this.thumbnailGenerator.generate(file.buffer, 200, 200);
      const thumbnailFileName = `thumb_${sanitizedFileName}`;
      thumbnailPath = `projects/${projectId}/assets/thumbnails/${thumbnailFileName}`;
      await this.fileStorage.save({ ...file, buffer: thumbnailBuffer }, thumbnailPath);
    }

    return this.uow.execute(async (trx) => {
      const storedPath = await this.fileStorage.save(file, path);
      const now = new Date();

      const asset: Asset = {
        id: generateGuid(),
        projectId,
        folderId,
        type: this.getAssetType(file.mimeType),
        path: storedPath,
        mimeType: file.mimeType,
        size: file.size,
        width,
        height,
        metadata: { thumbnailPath },
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await this.assetRepo.save(asset, trx);
      return asset;
    });
  }

  private validateFile(file: { buffer: Buffer; originalName: string; mimeType: string; size: number }): void {
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new DomainError('FILE_TOO_LARGE', 'errors.fileTooLarge', { maxSize: MAX_UPLOAD_SIZE, size: file.size }, 413);
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
      throw new DomainError('UNSUPPORTED_MIME_TYPE', 'errors.unsupportedMimeType', { mimeType: file.mimeType }, 415);
    }

    if (!this.isValidFileName(file.originalName)) {
      throw new DomainError('INVALID_FILE_NAME', 'errors.invalidFileName', { fileName: file.originalName }, 400);
    }
  }

  private sanitizeFileName(fileName: string): string {
    const baseName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const parts = baseName.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    const name = parts.join('_');
    const sanitizedName = `${name}.${ext}`.toLowerCase();

    if (sanitizedName.includes('..') || sanitizedName.includes('/') || sanitizedName.includes('\\')) {
      throw new DomainError('PATH_TRAVERSAL_ATTEMPT', 'errors.pathTraversalAttempt', { fileName }, 403);
    }

    return sanitizedName;
  }

  private isValidFileName(fileName: string): boolean {
    if (fileName.length === 0 || fileName.length > 255) return false;
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) return false;
    if (fileName.startsWith('.') || fileName.endsWith('.')) return false;
    return true;
  }

  private getAssetType(mimeType: string): AssetType {
    if (mimeType.startsWith('image/')) return AssetType.IMAGE;
    if (mimeType.startsWith('audio/')) return AssetType.AUDIO;
    if (mimeType.startsWith('video/')) return AssetType.VIDEO;
    if (mimeType.startsWith('application/')) return AssetType.DOCUMENT;
    return AssetType.OTHER;
  }

  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    // Simple implementation using built-in Buffer inspection for common image formats
    try {
      if (buffer.length < 24) return { width: 0, height: 0 };

      // PNG: Check signature and read from IHDR chunk
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }

      // JPEG: Parse markers to find SOF (Start Of Frame)
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        let offset = 2;
        while (offset < buffer.length) {
          if (buffer[offset] !== 0xff) {
            offset++;
            continue;
          }
          const marker = buffer[offset + 1];
          if (marker >= 0xc0 && marker <= 0xc3 && marker !== 0xc4) {
            // SOF0, SOF1, SOF2, SOF3
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          if (marker === 0xd9) break; // EOI
          const length = buffer.readUInt16BE(offset + 2);
          offset += 2 + length;
        }
      }

      // GIF: Read from header
      if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        const width = buffer.readUInt16LE(6);
        const height = buffer.readUInt16LE(8);
        return { width, height };
      }

      // WebP: Check for VP8/VP8X
      if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
          buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        const fourCC = buffer.toString('ascii', 12, 16);
        if (fourCC === 'VP8 ') {
          // Lossy WebP
          const w1 = buffer[26];
          const w2 = buffer[27];
          const h1 = buffer[28];
          const h2 = buffer[29];
          const width = w1 | ((w2 & 0x3f) << 8);
          const height = h1 | ((h2 & 0x3f) << 8);
          return { width, height };
        } else if (fourCC === 'VP8X') {
          // Extended WebP
          const width = 1 + buffer[24] | (buffer[25] << 8) | (buffer[26] << 16);
          const height = 1 + buffer[27] | (buffer[28] << 8) | (buffer[29] << 16);
          return { width, height };
        }
      }

      return { width: 0, height: 0 };
    } catch {
      return { width: 0, height: 0 };
    }
  }
}

export class GetAssetUseCase {
  constructor(private readonly assetRepo: AssetRepository) {}

  async execute(id: Guid): Promise<Asset> {
    const asset = await this.assetRepo.findById(id);
    if (!asset) {
      throw new DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
    }
    return asset;
  }
}

export class ListAssetsUseCase {
  constructor(private readonly assetRepo: AssetRepository) {}

  async execute(projectId: Guid, folderId?: Guid | null): Promise<Asset[]> {
    if (folderId !== undefined && folderId !== null) {
      return this.assetRepo.findByFolderId(folderId);
    }
    return this.assetRepo.findByProjectId(projectId);
  }
}

export class DeleteAssetUseCase {
  constructor(
    private readonly assetRepo: AssetRepository,
    private readonly fileStorage: FileStorage,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const asset = await this.assetRepo.findById(id, trx);
      if (!asset) {
        throw new DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
      }

      if (asset.usageCount > 0) {
        throw new DomainError('ASSET_IN_USE', 'errors.assetInUse', { id, usageCount: asset.usageCount }, 409);
      }

      await this.fileStorage.delete(asset.path);

      const thumbnailPath = asset.metadata['thumbnailPath'] as string | null;
      if (thumbnailPath) {
        await this.fileStorage.delete(thumbnailPath);
      }

      await this.assetRepo.delete(id, trx);
    });
  }
}

export class CreateAssetFolderUseCase {
  constructor(
    private readonly folderRepo: AssetFolderRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(projectId: Guid, name: string, parentId: Guid | null = null): Promise<AssetFolder> {
    if (parentId) {
      const parent = await this.folderRepo.findById(parentId);
      if (!parent) {
        throw new DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { parentId }, 404);
      }
      if (parent.projectId !== projectId) {
        throw new DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { parentId }, 403);
      }
    }

    return this.uow.execute(async (trx) => {
      const now = new Date();
      const folder: AssetFolder = {
        id: generateGuid(),
        projectId,
        parentId,
        name,
        createdAt: now,
        updatedAt: now,
      };

      await this.folderRepo.save(folder, trx);
      return folder;
    });
  }
}

export class ListAssetFoldersUseCase {
  constructor(private readonly folderRepo: AssetFolderRepository) {}

  async execute(projectId: Guid, parentId?: Guid | null): Promise<AssetFolder[]> {
    if (parentId !== undefined) {
      return this.folderRepo.findByParentId(parentId, projectId);
    }
    return this.folderRepo.findByProjectId(projectId);
  }
}

export class DeleteAssetFolderUseCase {
  constructor(
    private readonly folderRepo: AssetFolderRepository,
    private readonly assetRepo: AssetRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const folder = await this.folderRepo.findById(id, trx);
      if (!folder) {
        throw new DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { id }, 404);
      }

      const assets = await this.assetRepo.findByFolderId(id, trx);
      if (assets.length > 0) {
        throw new DomainError('FOLDER_NOT_EMPTY', 'errors.folderNotEmpty', { id, assetCount: assets.length }, 409);
      }

      const childFolders = await this.folderRepo.findByParentId(id, folder.projectId, trx);
      if (childFolders.length > 0) {
        throw new DomainError('FOLDER_HAS_CHILDREN', 'errors.folderHasChildren', { id, childCount: childFolders.length }, 409);
      }

      await this.folderRepo.delete(id, trx);
    });
  }
}
