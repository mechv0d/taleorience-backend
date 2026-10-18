import { Project, GameObject, Page, Block, BlockType, Guid, generateGuid, DomainError, Asset, AssetType, AssetFolder, Tag, GameObjectTag, Relation, Reference } from '@taleorience/domain';
import { 
  ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, UnitOfWork,
  AssetRepository, AssetFolderRepository, FileStorage, ThumbnailGenerator,
  TagRepository, GameObjectTagRepository, RelationRepository, ReferenceRepository, SearchIndexRepository
} from './ports';
import { parseMarkdownReferences } from './markdown-references';
import { validateBlockData, normalizeBlockData, blockToText } from './block-data';

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

export class ListGameObjectsUseCase {
  constructor(private readonly goRepo: GameObjectRepository) {}
  async execute(projectId: Guid): Promise<GameObject[]> {
    const items = await this.goRepo.findByProjectId(projectId);
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

export interface GameObjectTreeNode extends GameObject {
  children: GameObjectTreeNode[];
}

export class GetGameObjectTreeUseCase {
  constructor(private readonly goRepo: GameObjectRepository) {}
  async execute(projectId: Guid): Promise<GameObjectTreeNode[]> {
    const items = await this.goRepo.findByProjectId(projectId);
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const byId = new Map<Guid, GameObjectTreeNode>();
    for (const go of sorted) byId.set(go.id, { ...go, children: [] });

    const roots: GameObjectTreeNode[] = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
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
  constructor(
    private readonly repo: BlockRepository,
    private readonly referenceRepo: ReferenceRepository,
    private readonly goRepo: GameObjectRepository,
    private readonly searchIndexRepo: SearchIndexRepository,
    private readonly uow: UnitOfWork,
  ) {}
  
  async execute(projectId: Guid, pageId: Guid, type: BlockType, data: Record<string, unknown>): Promise<Block> {
    this.validateBlockData(type, data);
    const normalized = normalizeBlockData(type, data);
    
    return this.uow.execute(async (trx) => {
      const now = new Date();
      const existing = await this.repo.findByPageId(pageId, trx);
      const nextSortOrder = existing.length > 0
        ? Math.max(...existing.map((b) => b.sortOrder)) + 1
        : 0;
      const block: Block = {
        id: generateGuid(), projectId, pageId, type, data: normalized,
        sortOrder: nextSortOrder, createdAt: now, updatedAt: now,
      };
      await this.repo.save(block, trx);

      await this.syncReferences(block, trx);
      await this.reindexBlock(block, trx);

      return block;
    });
  }

  private async syncReferences(block: Block, trx: unknown): Promise<void> {
    if (block.type !== BlockType.TEXT) {
      return;
    }
    const content = typeof block.data['content'] === 'string' ? block.data['content'] : '';
    const parsed = parseMarkdownReferences(content);

    await this.referenceRepo.deleteBySourceBlockId(block.id, trx);

    for (const ref of parsed) {
      const target = await this.goRepo.findByName(block.projectId, ref.name, trx);
      if (!target) {
        continue;
      }
      await this.referenceRepo.save({
        id: generateGuid(),
        projectId: block.projectId,
        sourceBlockId: block.id,
        targetGameObjectId: target.id,
        label: ref.label,
        createdAt: new Date(),
      }, trx);
    }
  }

  private async reindexBlock(block: Block, trx: unknown): Promise<void> {
    await this.searchIndexRepo.deleteByEntityId(block.id, trx);
    const text = this.blockToText(block);
    if (!text) {
      return;
    }
    await this.searchIndexRepo.index([{
      id: generateGuid(),
      projectId: block.projectId,
      entityType: 'block',
      entityId: block.id,
      text,
    }], trx);
  }

  private blockToText(block: Block): string {
    return blockToText(block);
  }

  private validateBlockData(type: BlockType, data: Record<string, unknown>): void {
    validateBlockData(type, data);
  }
}

export class UpdateBlockUseCase {
  constructor(
    private readonly repo: BlockRepository,
    private readonly referenceRepo: ReferenceRepository,
    private readonly goRepo: GameObjectRepository,
    private readonly searchIndexRepo: SearchIndexRepository,
    private readonly uow: UnitOfWork,
  ) {}
  async execute(id: Guid, data: Record<string, unknown>): Promise<Block> {
    return this.uow.execute(async (trx) => {
      const block = await this.repo.findById(id, trx);
      if (!block) throw new DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);
      
      this.validateBlockData(block.type, data);
      block.data = normalizeBlockData(block.type, data);
      block.updatedAt = new Date();
      await this.repo.save(block, trx);

      await this.syncReferences(block, trx);
      await this.reindexBlock(block, trx);

      return block;
    });
  }
  private validateBlockData(type: BlockType, data: Record<string, unknown>): void {
    validateBlockData(type, data);
  }
  private async syncReferences(block: Block, trx: unknown): Promise<void> {
    if (block.type !== BlockType.TEXT) {
      return;
    }
    const content = typeof block.data['content'] === 'string' ? block.data['content'] : '';
    const parsed = parseMarkdownReferences(content);

    await this.referenceRepo.deleteBySourceBlockId(block.id, trx);

    for (const ref of parsed) {
      const target = await this.goRepo.findByName(block.projectId, ref.name, trx);
      if (!target) {
        continue;
      }
      await this.referenceRepo.save({
        id: generateGuid(),
        projectId: block.projectId,
        sourceBlockId: block.id,
        targetGameObjectId: target.id,
        label: ref.label,
        createdAt: new Date(),
      }, trx);
    }
  }
  private async reindexBlock(block: Block, trx: unknown): Promise<void> {
    await this.searchIndexRepo.deleteByEntityId(block.id, trx);
    const text = this.blockToText(block);
    if (!text) {
      return;
    }
    await this.searchIndexRepo.index([{
      id: generateGuid(),
      projectId: block.projectId,
      entityType: 'block',
      entityId: block.id,
      text,
    }], trx);
  }
  private blockToText(block: Block): string {
    return blockToText(block);
  }
}

export class ListPageBlocksUseCase {
  constructor(private readonly repo: BlockRepository) {}
  async execute(pageId: Guid): Promise<Block[]> {
    const blocks = await this.repo.findByPageId(pageId);
    return blocks.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

export class GetBlockUseCase {
  constructor(private readonly repo: BlockRepository) {}
  async execute(id: Guid): Promise<Block> {
    const block = await this.repo.findById(id);
    if (!block) throw new DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);
    return block;
  }
}

export class DeleteBlockUseCase {
  constructor(
    private readonly repo: BlockRepository,
    private readonly referenceRepo: ReferenceRepository,
    private readonly searchIndexRepo: SearchIndexRepository,
    private readonly uow: UnitOfWork,
  ) {}
  async execute(id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const block = await this.repo.findById(id, trx);
      if (!block) throw new DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);

      await this.referenceRepo.deleteBySourceBlockId(id, trx);
      await this.searchIndexRepo.deleteByEntityId(id, trx);
      await this.repo.delete(id, trx);
    });
  }
}

export class MoveBlockUseCase {
  constructor(
    private readonly repo: BlockRepository,
    private readonly uow: UnitOfWork,
  ) {}
  async execute(id: Guid, toIndex: number): Promise<Block[]> {
    return this.uow.execute(async (trx) => {
      const block = await this.repo.findById(id, trx);
      if (!block) throw new DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);

      const blocks = (await this.repo.findByPageId(block.pageId, trx))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const fromIndex = blocks.findIndex((b) => b.id === id);
      if (fromIndex === -1) throw new DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);

      const target = Math.max(0, Math.min(toIndex, blocks.length - 1));
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(target, 0, moved);

      const now = new Date();
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].sortOrder === i) continue;
        blocks[i].sortOrder = i;
        blocks[i].updatedAt = now;
        await this.repo.save(blocks[i], trx);
      }
      return blocks;
    });
  }
}

export class DuplicateBlockUseCase {
  constructor(
    private readonly repo: BlockRepository,
    private readonly referenceRepo: ReferenceRepository,
    private readonly goRepo: GameObjectRepository,
    private readonly searchIndexRepo: SearchIndexRepository,
    private readonly uow: UnitOfWork,
  ) {}
  async execute(id: Guid, toIndex?: number): Promise<Block> {
    return this.uow.execute(async (trx) => {
      const source = await this.repo.findById(id, trx);
      if (!source) throw new DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);

      const blocks = (await this.repo.findByPageId(source.pageId, trx))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const now = new Date();
      const copy: Block = {
        id: generateGuid(),
        projectId: source.projectId,
        pageId: source.pageId,
        type: source.type,
        data: JSON.parse(JSON.stringify(source.data)),
        sortOrder: toIndex ?? blocks.length,
        createdAt: now,
        updatedAt: now,
      };

      await this.repo.save(copy, trx);

      const target = Math.max(0, Math.min(copy.sortOrder, blocks.length));
      const newOrder = [...blocks];
      newOrder.splice(target, 0, copy);
      for (let i = 0; i < newOrder.length; i++) {
        if (newOrder[i].sortOrder === i) continue;
        newOrder[i].sortOrder = i;
        newOrder[i].updatedAt = now;
        await this.repo.save(newOrder[i], trx);
      }

      await this.syncReferences(copy, trx);
      await this.reindexBlock(copy, trx);

      return copy;
    });
  }

  private async syncReferences(block: Block, trx: unknown): Promise<void> {
    if (block.type !== BlockType.TEXT) {
      return;
    }
    const content = typeof block.data['content'] === 'string' ? block.data['content'] : '';
    const parsed = parseMarkdownReferences(content);

    for (const ref of parsed) {
      const target = await this.goRepo.findByName(block.projectId, ref.name, trx);
      if (!target) {
        continue;
      }
      await this.referenceRepo.save({
        id: generateGuid(),
        projectId: block.projectId,
        sourceBlockId: block.id,
        targetGameObjectId: target.id,
        label: ref.label,
        createdAt: new Date(),
      }, trx);
    }
  }

  private async reindexBlock(block: Block, trx: unknown): Promise<void> {
    const text = blockToText(block);
    if (!text) {
      return;
    }
    await this.searchIndexRepo.index([{
      id: generateGuid(),
      projectId: block.projectId,
      entityType: 'block',
      entityId: block.id,
      text,
    }], trx);
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

    if (folderId) {
      const folder = await this.folderRepo.findById(folderId);
      if (!folder) {
        throw new DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { folderId }, 404);
      }
      if (folder.projectId !== projectId) {
        throw new DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { folderId }, 403);
      }
    }

    let width: number | null = null;
    let height: number | null = null;
    let thumbnailPath: string | null = null;

    if (file.mimeType.startsWith('image/')) {
      const dimensions = await this.getImageDimensions(file.buffer);
      width = dimensions.width;
      height = dimensions.height;

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

  async execute(projectId: Guid, id: Guid): Promise<Asset> {
    const asset = await this.assetRepo.findById(id);
    if (!asset) {
      throw new DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
    }
    if (asset.projectId !== projectId) {
      throw new DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
    }
    return asset;
  }
}

export class ListAssetsUseCase {
  constructor(
    private readonly assetRepo: AssetRepository,
    private readonly folderRepo: AssetFolderRepository,
  ) {}

  async execute(projectId: Guid, folderId?: Guid | null): Promise<Asset[]> {
    if (folderId !== undefined && folderId !== null) {
      const folder = await this.folderRepo.findById(folderId);
      if (!folder) {
        throw new DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { folderId }, 404);
      }
      if (folder.projectId !== projectId) {
        throw new DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { folderId }, 403);
      }
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

  async execute(projectId: Guid, id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const asset = await this.assetRepo.findById(id, trx);
      if (!asset) {
        throw new DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
      }
      if (asset.projectId !== projectId) {
        throw new DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
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

  async execute(projectId: Guid, id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const folder = await this.folderRepo.findById(id, trx);
      if (!folder) {
        throw new DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { id }, 404);
      }
      if (folder.projectId !== projectId) {
        throw new DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { id }, 403);
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

export class UpdateAssetUseCase {
  constructor(private readonly assetRepo: AssetRepository, private readonly uow: UnitOfWork) {}

  async execute(
    projectId: Guid,
    id: Guid,
    changes: { folderId?: Guid | null; metadata?: Record<string, unknown> },
  ): Promise<Asset> {
    return this.uow.execute(async (trx) => {
      const asset = await this.assetRepo.findById(id, trx);
      if (!asset) {
        throw new DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
      }
      if (asset.projectId !== projectId) {
        throw new DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
      }

      asset.folderId = changes.folderId !== undefined ? changes.folderId : asset.folderId;
      if (changes.metadata) {
        asset.metadata = { ...asset.metadata, ...changes.metadata };
      }
      asset.updatedAt = new Date();

      await this.assetRepo.save(asset, trx);
      return asset;
    });
  }
}

export class GetAssetContentUseCase {
  constructor(
    private readonly assetRepo: AssetRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(projectId: Guid, id: Guid): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
    const asset = await this.assetRepo.findById(id);
    if (!asset) {
      throw new DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
    }
    if (asset.projectId !== projectId) {
      throw new DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
    }

    const buffer = await this.fileStorage.get(asset.path);
    return { buffer, mimeType: asset.mimeType, size: buffer.length };
  }
}

export class GetAssetThumbnailUseCase {
  constructor(
    private readonly assetRepo: AssetRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(projectId: Guid, id: Guid): Promise<{ buffer: Buffer; mimeType: string }> {
    const asset = await this.assetRepo.findById(id);
    if (!asset) {
      throw new DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
    }
    if (asset.projectId !== projectId) {
      throw new DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
    }

    const thumbnailPath = asset.metadata['thumbnailPath'] as string | undefined;
    if (!thumbnailPath) {
      throw new DomainError('THUMBNAIL_NOT_AVAILABLE', 'errors.thumbnailNotAvailable', { id }, 404);
    }

    const buffer = await this.fileStorage.get(thumbnailPath);
    return { buffer, mimeType: 'image/jpeg' };
  }
}

// --- TAGS ---
export class CreateTagUseCase {
  constructor(private readonly tagRepo: TagRepository, private readonly uow: UnitOfWork) {}

  async execute(projectId: Guid, name: string): Promise<Tag> {
    const normalized = name.trim();
    if (!normalized) {
      throw new DomainError('INVALID_TAG_NAME', 'errors.invalidTagName', { name }, 400);
    }

    const existing = await this.tagRepo.findByNames(projectId, [normalized]);
    if (existing.length > 0) {
      throw new DomainError('TAG_ALREADY_EXISTS', 'errors.tagAlreadyExists', { name: normalized }, 409);
    }

    return this.uow.execute(async (trx) => {
      const now = new Date();
      const tag: Tag = {
        id: generateGuid(),
        projectId,
        name: normalized,
        createdAt: now,
        updatedAt: now,
      };
      await this.tagRepo.save(tag, trx);
      return tag;
    });
  }
}

export class ListTagsUseCase {
  constructor(private readonly tagRepo: TagRepository) {}

  execute(projectId: Guid): Promise<Tag[]> {
    return this.tagRepo.findByProjectId(projectId);
  }
}

export class DeleteTagUseCase {
  constructor(
    private readonly tagRepo: TagRepository,
    private readonly goTagRepo: GameObjectTagRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(projectId: Guid, id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const tag = await this.tagRepo.findById(id, trx);
      if (!tag) {
        throw new DomainError('TAG_NOT_FOUND', 'errors.tagNotFound', { id }, 404);
      }
      if (tag.projectId !== projectId) {
        throw new DomainError('TAG_NOT_IN_PROJECT', 'errors.tagNotInProject', { id }, 403);
      }

      const mappings = await this.goTagRepo.findByTagId(id, trx);
      for (const mapping of mappings) {
        await this.goTagRepo.remove(mapping.gameObjectId, id, trx);
      }

      await this.tagRepo.delete(id, trx);
    });
  }
}

export class AddTagToGameObjectUseCase {
  constructor(
    private readonly tagRepo: TagRepository,
    private readonly goTagRepo: GameObjectTagRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(projectId: Guid, gameObjectId: Guid, tagName: string): Promise<GameObjectTag> {
    const normalized = tagName.trim();
    if (!normalized) {
      throw new DomainError('INVALID_TAG_NAME', 'errors.invalidTagName', { name: tagName }, 400);
    }

    return this.uow.execute(async (trx) => {
      const existingTags = await this.tagRepo.findByNames(projectId, [normalized], trx);
      let tag = existingTags[0] ?? null;

      if (!tag) {
        const now = new Date();
        tag = {
          id: generateGuid(),
          projectId,
          name: normalized,
          createdAt: now,
          updatedAt: now,
        };
        await this.tagRepo.save(tag, trx);
      }

      const mapping: GameObjectTag = {
        gameObjectId,
        tagId: tag.id,
        createdAt: new Date(),
      };
      await this.goTagRepo.add(gameObjectId, tag.id, trx);
      return mapping;
    });
  }
}

export class RemoveTagFromGameObjectUseCase {
  constructor(
    private readonly goTagRepo: GameObjectTagRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(gameObjectId: Guid, tagId: Guid): Promise<void> {
    await this.uow.execute(async (trx) => {
      await this.goTagRepo.remove(gameObjectId, tagId, trx);
    });
  }
}

export class ListGameObjectTagsUseCase {
  constructor(
    private readonly goTagRepo: GameObjectTagRepository,
    private readonly tagRepo: TagRepository,
  ) {}

  async execute(gameObjectId: Guid): Promise<Tag[]> {
    const mappings = await this.goTagRepo.findByGameObjectId(gameObjectId);
    const tags: Tag[] = [];
    for (const mapping of mappings) {
      const tag = await this.tagRepo.findById(mapping.tagId);
      if (tag) {
        tags.push(tag);
      }
    }
    return tags;
  }
}

// --- RELATIONS ---
export class CreateRelationUseCase {
  constructor(
    private readonly relationRepo: RelationRepository,
    private readonly goRepo: GameObjectRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    projectId: Guid,
    sourceGameObjectId: Guid,
    targetGameObjectId: Guid,
    type: string,
  ): Promise<Relation> {
    if (!type.trim()) {
      throw new DomainError('INVALID_RELATION_TYPE', 'errors.invalidRelationType', { type }, 400);
    }

    const source = await this.goRepo.findById(sourceGameObjectId);
    if (!source) {
      throw new DomainError('GAME_OBJECT_NOT_FOUND', 'errors.gameObjectNotFound', { id: sourceGameObjectId }, 404);
    }
    if (source.projectId !== projectId) {
      throw new DomainError('GAME_OBJECT_NOT_IN_PROJECT', 'errors.gameObjectNotInProject', { id: sourceGameObjectId }, 403);
    }

    const target = await this.goRepo.findById(targetGameObjectId);
    if (!target) {
      throw new DomainError('GAME_OBJECT_NOT_FOUND', 'errors.gameObjectNotFound', { id: targetGameObjectId }, 404);
    }
    if (target.projectId !== projectId) {
      throw new DomainError('GAME_OBJECT_NOT_IN_PROJECT', 'errors.gameObjectNotInProject', { id: targetGameObjectId }, 403);
    }

    return this.uow.execute(async (trx) => {
      const now = new Date();
      const relation: Relation = {
        id: generateGuid(),
        projectId,
        sourceGameObjectId,
        targetGameObjectId,
        type: type.trim(),
        createdAt: now,
      };
      await this.relationRepo.save(relation, trx);
      return relation;
    });
  }
}

export class ListRelationsUseCase {
  constructor(private readonly relationRepo: RelationRepository) {}

  execute(projectId: Guid): Promise<Relation[]> {
    return this.relationRepo.findByProjectId(projectId);
  }
}

export class ListGameObjectRelationsUseCase {
  constructor(private readonly relationRepo: RelationRepository) {}

  async execute(gameObjectId: Guid): Promise<Relation[]> {
    const outgoing = await this.relationRepo.findBySourceGameObjectId(gameObjectId);
    const incoming = await this.relationRepo.findByTargetGameObjectId(gameObjectId);
    return [...outgoing, ...incoming];
  }
}

export class DeleteRelationUseCase {
  constructor(private readonly relationRepo: RelationRepository, private readonly uow: UnitOfWork) {}

  async execute(projectId: Guid, id: Guid): Promise<void> {
    return this.uow.execute(async (trx) => {
      const relation = await this.relationRepo.findById(id, trx);
      if (!relation) {
        throw new DomainError('RELATION_NOT_FOUND', 'errors.relationNotFound', { id }, 404);
      }
      if (relation.projectId !== projectId) {
        throw new DomainError('RELATION_NOT_IN_PROJECT', 'errors.relationNotInProject', { id }, 403);
      }
      await this.relationRepo.delete(id, trx);
    });
  }
}

// --- REFERENCES (markdown [[GameObject]]) ---
export class SyncBlockReferencesUseCase {
  constructor(
    private readonly referenceRepo: ReferenceRepository,
    private readonly goRepo: GameObjectRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(blockId: Guid, projectId: Guid, content: string): Promise<Reference[]> {
    const parsed = parseMarkdownReferences(content);

    return this.uow.execute(async (trx) => {
      await this.referenceRepo.deleteBySourceBlockId(blockId, trx);

      const references: Reference[] = [];
      for (const ref of parsed) {
        const target = await this.goRepo.findByName(projectId, ref.name, trx);
        if (!target) {
          continue;
        }

        const reference: Reference = {
          id: generateGuid(),
          projectId,
          sourceBlockId: blockId,
          targetGameObjectId: target.id,
          label: ref.label,
          createdAt: new Date(),
        };
        await this.referenceRepo.save(reference, trx);
        references.push(reference);
      }

      return references;
    });
  }
}

export class GetBacklinksUseCase {
  constructor(
    private readonly referenceRepo: ReferenceRepository,
    private readonly blockRepo: BlockRepository,
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(projectId: Guid, gameObjectId: Guid): Promise<Array<{
    referenceId: Guid;
    blockId: Guid;
    pageId: Guid;
    pageTitle: string;
    label: string | null;
  }>> {
    const references = await this.referenceRepo.findByTargetGameObjectId(gameObjectId);
    const backlinks: Array<{
      referenceId: Guid;
      blockId: Guid;
      pageId: Guid;
      pageTitle: string;
      label: string | null;
    }> = [];

    for (const ref of references) {
      const block = await this.blockRepo.findById(ref.sourceBlockId);
      if (!block || block.projectId !== projectId) {
        continue;
      }
      const page = await this.pageRepo.findById(block.pageId);
      if (!page) {
        continue;
      }
      backlinks.push({
        referenceId: ref.id,
        blockId: block.id,
        pageId: page.id,
        pageTitle: page.title,
        label: ref.label,
      });
    }

    return backlinks;
  }
}

export class ResolveReferencesUseCase {
  constructor(private readonly goRepo: GameObjectRepository) {}

  async execute(projectId: Guid, query: string, limit = 20): Promise<GameObject[]> {
    return this.goRepo.searchByName(projectId, query, limit);
  }
}

// --- SEARCH INDEX ---
export class SearchUseCase {
  constructor(private readonly searchIndexRepo: SearchIndexRepository) {}

  async execute(projectId: Guid, query: string, limit = 20): Promise<import('./ports').SearchIndexEntry[]> {
    return this.searchIndexRepo.search(projectId, query, limit);
  }
}
