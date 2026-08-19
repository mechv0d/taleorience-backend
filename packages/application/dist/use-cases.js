"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchUseCase = exports.ResolveReferencesUseCase = exports.GetBacklinksUseCase = exports.SyncBlockReferencesUseCase = exports.DeleteRelationUseCase = exports.ListGameObjectRelationsUseCase = exports.ListRelationsUseCase = exports.CreateRelationUseCase = exports.ListGameObjectTagsUseCase = exports.RemoveTagFromGameObjectUseCase = exports.AddTagToGameObjectUseCase = exports.DeleteTagUseCase = exports.ListTagsUseCase = exports.CreateTagUseCase = exports.GetAssetThumbnailUseCase = exports.GetAssetContentUseCase = exports.UpdateAssetUseCase = exports.DeleteAssetFolderUseCase = exports.ListAssetFoldersUseCase = exports.CreateAssetFolderUseCase = exports.DeleteAssetUseCase = exports.ListAssetsUseCase = exports.GetAssetUseCase = exports.UploadAssetUseCase = exports.UpdateBlockUseCase = exports.CreateBlockUseCase = exports.DeleteGameObjectUseCase = exports.CreateGameObjectUseCase = exports.DeleteProjectUseCase = exports.ListProjectsUseCase = exports.GetProjectUseCase = exports.CreateProjectUseCase = void 0;
const domain_1 = require("@taleorience/domain");
const markdown_references_1 = require("./markdown-references");
// --- PROJECTS ---
class CreateProjectUseCase {
    repo;
    uow;
    constructor(repo, uow) {
        this.repo = repo;
        this.uow = uow;
    }
    async execute(name, description) {
        return this.uow.execute(async (trx) => {
            const now = new Date();
            const project = {
                id: (0, domain_1.generateGuid)(), name, description,
                bannerAssetId: null, isExample: false, isReadOnly: false,
                createdAt: now, updatedAt: now,
            };
            await this.repo.save(project, trx);
            return project;
        });
    }
}
exports.CreateProjectUseCase = CreateProjectUseCase;
class GetProjectUseCase {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id) {
        const project = await this.repo.findById(id);
        if (!project)
            throw new domain_1.DomainError('PROJECT_NOT_FOUND', 'errors.projectNotFound', { id }, 404);
        return project;
    }
}
exports.GetProjectUseCase = GetProjectUseCase;
class ListProjectsUseCase {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    execute() { return this.repo.findAll(); }
}
exports.ListProjectsUseCase = ListProjectsUseCase;
class DeleteProjectUseCase {
    repo;
    uow;
    constructor(repo, uow) {
        this.repo = repo;
        this.uow = uow;
    }
    async execute(id) {
        return this.uow.execute(async (trx) => {
            const exists = await this.repo.findById(id, trx);
            if (!exists)
                throw new domain_1.DomainError('PROJECT_NOT_FOUND', 'errors.projectNotFound', { id }, 404);
            await this.repo.delete(id, trx);
        });
    }
}
exports.DeleteProjectUseCase = DeleteProjectUseCase;
// --- GAME OBJECTS ---
class CreateGameObjectUseCase {
    goRepo;
    pageRepo;
    uow;
    constructor(goRepo, pageRepo, uow) {
        this.goRepo = goRepo;
        this.pageRepo = pageRepo;
        this.uow = uow;
    }
    async execute(projectId, name, parentId = null) {
        return this.uow.execute(async (trx) => {
            const now = new Date();
            const gameObject = {
                id: (0, domain_1.generateGuid)(), projectId, parentId, name,
                icon: null, sortOrder: 0, createdAt: now, updatedAt: now,
            };
            await this.goRepo.save(gameObject, trx);
            // Бизнес-правило: При создании GameObject автоматически создается страница "Main"
            const mainPage = {
                id: (0, domain_1.generateGuid)(), projectId, gameObjectId: gameObject.id,
                title: 'Main', sortOrder: 0, createdAt: now, updatedAt: now,
            };
            await this.pageRepo.save(mainPage, trx);
            return gameObject;
        });
    }
}
exports.CreateGameObjectUseCase = CreateGameObjectUseCase;
class DeleteGameObjectUseCase {
    goRepo;
    pageRepo;
    blockRepo;
    uow;
    constructor(goRepo, pageRepo, blockRepo, uow) {
        this.goRepo = goRepo;
        this.pageRepo = pageRepo;
        this.blockRepo = blockRepo;
        this.uow = uow;
    }
    async execute(id) {
        return this.uow.execute(async (trx) => {
            const go = await this.goRepo.findById(id, trx);
            if (!go)
                throw new domain_1.DomainError('GAME_OBJECT_NOT_FOUND', 'errors.gameObjectNotFound', { id }, 404);
            // Каскадное удаление через Application Layer (соблюдаем правило "Domain owns mutations")
            const pages = await this.pageRepo.findByGameObjectId(id, trx);
            for (const page of pages) {
                const blocks = await this.blockRepo.findByPageId(page.id, trx);
                for (const block of blocks)
                    await this.blockRepo.delete(block.id, trx);
                await this.pageRepo.delete(page.id, trx);
            }
            await this.goRepo.delete(id, trx);
        });
    }
}
exports.DeleteGameObjectUseCase = DeleteGameObjectUseCase;
// --- BLOCKS ---
class CreateBlockUseCase {
    repo;
    referenceRepo;
    goRepo;
    searchIndexRepo;
    uow;
    constructor(repo, referenceRepo, goRepo, searchIndexRepo, uow) {
        this.repo = repo;
        this.referenceRepo = referenceRepo;
        this.goRepo = goRepo;
        this.searchIndexRepo = searchIndexRepo;
        this.uow = uow;
    }
    async execute(projectId, pageId, type, data) {
        this.validateBlockData(type, data);
        return this.uow.execute(async (trx) => {
            const now = new Date();
            const block = {
                id: (0, domain_1.generateGuid)(), projectId, pageId, type, data,
                sortOrder: 0, createdAt: now, updatedAt: now,
            };
            await this.repo.save(block, trx);
            await this.syncReferences(block, trx);
            await this.reindexBlock(block, trx);
            return block;
        });
    }
    async syncReferences(block, trx) {
        if (block.type !== domain_1.BlockType.TEXT) {
            return;
        }
        const content = typeof block.data['content'] === 'string' ? block.data['content'] : '';
        const parsed = (0, markdown_references_1.parseMarkdownReferences)(content);
        await this.referenceRepo.deleteBySourceBlockId(block.id, trx);
        for (const ref of parsed) {
            const target = await this.goRepo.findByName(block.projectId, ref.name, trx);
            if (!target) {
                continue;
            }
            await this.referenceRepo.save({
                id: (0, domain_1.generateGuid)(),
                projectId: block.projectId,
                sourceBlockId: block.id,
                targetGameObjectId: target.id,
                label: ref.label,
                createdAt: new Date(),
            }, trx);
        }
    }
    async reindexBlock(block, trx) {
        await this.searchIndexRepo.deleteByEntityId(block.id, trx);
        const text = this.blockToText(block);
        if (!text) {
            return;
        }
        await this.searchIndexRepo.index([{
                id: (0, domain_1.generateGuid)(),
                projectId: block.projectId,
                entityType: 'block',
                entityId: block.id,
                text,
            }], trx);
    }
    blockToText(block) {
        if (block.type === domain_1.BlockType.TEXT) {
            return typeof block.data['content'] === 'string' ? block.data['content'] : '';
        }
        return JSON.stringify(block.data);
    }
    validateBlockData(type, data) {
        if (type === domain_1.BlockType.TEXT && typeof data.content !== 'string') {
            throw new domain_1.DomainError('INVALID_BLOCK_DATA', 'errors.invalidBlockData', { type });
        }
    }
}
exports.CreateBlockUseCase = CreateBlockUseCase;
class UpdateBlockUseCase {
    repo;
    referenceRepo;
    goRepo;
    searchIndexRepo;
    uow;
    constructor(repo, referenceRepo, goRepo, searchIndexRepo, uow) {
        this.repo = repo;
        this.referenceRepo = referenceRepo;
        this.goRepo = goRepo;
        this.searchIndexRepo = searchIndexRepo;
        this.uow = uow;
    }
    async execute(id, data) {
        return this.uow.execute(async (trx) => {
            const block = await this.repo.findById(id, trx);
            if (!block)
                throw new domain_1.DomainError('BLOCK_NOT_FOUND', 'errors.blockNotFound', { id }, 404);
            this.validateBlockData(block.type, data);
            block.data = data;
            block.updatedAt = new Date();
            await this.repo.save(block, trx);
            await this.syncReferences(block, trx);
            await this.reindexBlock(block, trx);
            return block;
        });
    }
    validateBlockData(type, data) {
        if (type === domain_1.BlockType.TEXT && typeof data.content !== 'string') {
            throw new domain_1.DomainError('INVALID_BLOCK_DATA', 'errors.invalidBlockData', { type });
        }
    }
    async syncReferences(block, trx) {
        if (block.type !== domain_1.BlockType.TEXT) {
            return;
        }
        const content = typeof block.data['content'] === 'string' ? block.data['content'] : '';
        const parsed = (0, markdown_references_1.parseMarkdownReferences)(content);
        await this.referenceRepo.deleteBySourceBlockId(block.id, trx);
        for (const ref of parsed) {
            const target = await this.goRepo.findByName(block.projectId, ref.name, trx);
            if (!target) {
                continue;
            }
            await this.referenceRepo.save({
                id: (0, domain_1.generateGuid)(),
                projectId: block.projectId,
                sourceBlockId: block.id,
                targetGameObjectId: target.id,
                label: ref.label,
                createdAt: new Date(),
            }, trx);
        }
    }
    async reindexBlock(block, trx) {
        await this.searchIndexRepo.deleteByEntityId(block.id, trx);
        const text = this.blockToText(block);
        if (!text) {
            return;
        }
        await this.searchIndexRepo.index([{
                id: (0, domain_1.generateGuid)(),
                projectId: block.projectId,
                entityType: 'block',
                entityId: block.id,
                text,
            }], trx);
    }
    blockToText(block) {
        if (block.type === domain_1.BlockType.TEXT) {
            return typeof block.data['content'] === 'string' ? block.data['content'] : '';
        }
        return JSON.stringify(block.data);
    }
}
exports.UpdateBlockUseCase = UpdateBlockUseCase;
// --- ASSETS ---
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm',
]);
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
class UploadAssetUseCase {
    assetRepo;
    folderRepo;
    fileStorage;
    thumbnailGenerator;
    uow;
    constructor(assetRepo, folderRepo, fileStorage, thumbnailGenerator, uow) {
        this.assetRepo = assetRepo;
        this.folderRepo = folderRepo;
        this.fileStorage = fileStorage;
        this.thumbnailGenerator = thumbnailGenerator;
        this.uow = uow;
    }
    async execute(projectId, file, folderId = null) {
        this.validateFile(file);
        const sanitizedFileName = this.sanitizeFileName(file.originalName);
        const path = `projects/${projectId}/assets/${sanitizedFileName}`;
        if (folderId) {
            const folder = await this.folderRepo.findById(folderId);
            if (!folder) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { folderId }, 404);
            }
            if (folder.projectId !== projectId) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { folderId }, 403);
            }
        }
        let width = null;
        let height = null;
        let thumbnailPath = null;
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
            const asset = {
                id: (0, domain_1.generateGuid)(),
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
    validateFile(file) {
        if (file.size > MAX_UPLOAD_SIZE) {
            throw new domain_1.DomainError('FILE_TOO_LARGE', 'errors.fileTooLarge', { maxSize: MAX_UPLOAD_SIZE, size: file.size }, 413);
        }
        if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
            throw new domain_1.DomainError('UNSUPPORTED_MIME_TYPE', 'errors.unsupportedMimeType', { mimeType: file.mimeType }, 415);
        }
        if (!this.isValidFileName(file.originalName)) {
            throw new domain_1.DomainError('INVALID_FILE_NAME', 'errors.invalidFileName', { fileName: file.originalName }, 400);
        }
    }
    sanitizeFileName(fileName) {
        const baseName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const parts = baseName.split('.');
        const ext = parts.length > 1 ? parts.pop() : '';
        const name = parts.join('_');
        const sanitizedName = `${name}.${ext}`.toLowerCase();
        if (sanitizedName.includes('..') || sanitizedName.includes('/') || sanitizedName.includes('\\')) {
            throw new domain_1.DomainError('PATH_TRAVERSAL_ATTEMPT', 'errors.pathTraversalAttempt', { fileName }, 403);
        }
        return sanitizedName;
    }
    isValidFileName(fileName) {
        if (fileName.length === 0 || fileName.length > 255)
            return false;
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\'))
            return false;
        if (fileName.startsWith('.') || fileName.endsWith('.'))
            return false;
        return true;
    }
    getAssetType(mimeType) {
        if (mimeType.startsWith('image/'))
            return domain_1.AssetType.IMAGE;
        if (mimeType.startsWith('audio/'))
            return domain_1.AssetType.AUDIO;
        if (mimeType.startsWith('video/'))
            return domain_1.AssetType.VIDEO;
        if (mimeType.startsWith('application/'))
            return domain_1.AssetType.DOCUMENT;
        return domain_1.AssetType.OTHER;
    }
    async getImageDimensions(buffer) {
        // Simple implementation using built-in Buffer inspection for common image formats
        try {
            if (buffer.length < 24)
                return { width: 0, height: 0 };
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
                    if (marker === 0xd9)
                        break; // EOI
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
                }
                else if (fourCC === 'VP8X') {
                    // Extended WebP
                    const width = 1 + buffer[24] | (buffer[25] << 8) | (buffer[26] << 16);
                    const height = 1 + buffer[27] | (buffer[28] << 8) | (buffer[29] << 16);
                    return { width, height };
                }
            }
            return { width: 0, height: 0 };
        }
        catch {
            return { width: 0, height: 0 };
        }
    }
}
exports.UploadAssetUseCase = UploadAssetUseCase;
class GetAssetUseCase {
    assetRepo;
    constructor(assetRepo) {
        this.assetRepo = assetRepo;
    }
    async execute(projectId, id) {
        const asset = await this.assetRepo.findById(id);
        if (!asset) {
            throw new domain_1.DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
        }
        if (asset.projectId !== projectId) {
            throw new domain_1.DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
        }
        return asset;
    }
}
exports.GetAssetUseCase = GetAssetUseCase;
class ListAssetsUseCase {
    assetRepo;
    folderRepo;
    constructor(assetRepo, folderRepo) {
        this.assetRepo = assetRepo;
        this.folderRepo = folderRepo;
    }
    async execute(projectId, folderId) {
        if (folderId !== undefined && folderId !== null) {
            const folder = await this.folderRepo.findById(folderId);
            if (!folder) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { folderId }, 404);
            }
            if (folder.projectId !== projectId) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { folderId }, 403);
            }
            return this.assetRepo.findByFolderId(folderId);
        }
        return this.assetRepo.findByProjectId(projectId);
    }
}
exports.ListAssetsUseCase = ListAssetsUseCase;
class DeleteAssetUseCase {
    assetRepo;
    fileStorage;
    uow;
    constructor(assetRepo, fileStorage, uow) {
        this.assetRepo = assetRepo;
        this.fileStorage = fileStorage;
        this.uow = uow;
    }
    async execute(projectId, id) {
        return this.uow.execute(async (trx) => {
            const asset = await this.assetRepo.findById(id, trx);
            if (!asset) {
                throw new domain_1.DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
            }
            if (asset.projectId !== projectId) {
                throw new domain_1.DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
            }
            if (asset.usageCount > 0) {
                throw new domain_1.DomainError('ASSET_IN_USE', 'errors.assetInUse', { id, usageCount: asset.usageCount }, 409);
            }
            await this.fileStorage.delete(asset.path);
            const thumbnailPath = asset.metadata['thumbnailPath'];
            if (thumbnailPath) {
                await this.fileStorage.delete(thumbnailPath);
            }
            await this.assetRepo.delete(id, trx);
        });
    }
}
exports.DeleteAssetUseCase = DeleteAssetUseCase;
class CreateAssetFolderUseCase {
    folderRepo;
    uow;
    constructor(folderRepo, uow) {
        this.folderRepo = folderRepo;
        this.uow = uow;
    }
    async execute(projectId, name, parentId = null) {
        if (parentId) {
            const parent = await this.folderRepo.findById(parentId);
            if (!parent) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { parentId }, 404);
            }
            if (parent.projectId !== projectId) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { parentId }, 403);
            }
        }
        return this.uow.execute(async (trx) => {
            const now = new Date();
            const folder = {
                id: (0, domain_1.generateGuid)(),
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
exports.CreateAssetFolderUseCase = CreateAssetFolderUseCase;
class ListAssetFoldersUseCase {
    folderRepo;
    constructor(folderRepo) {
        this.folderRepo = folderRepo;
    }
    async execute(projectId, parentId) {
        if (parentId !== undefined) {
            return this.folderRepo.findByParentId(parentId, projectId);
        }
        return this.folderRepo.findByProjectId(projectId);
    }
}
exports.ListAssetFoldersUseCase = ListAssetFoldersUseCase;
class DeleteAssetFolderUseCase {
    folderRepo;
    assetRepo;
    uow;
    constructor(folderRepo, assetRepo, uow) {
        this.folderRepo = folderRepo;
        this.assetRepo = assetRepo;
        this.uow = uow;
    }
    async execute(projectId, id) {
        return this.uow.execute(async (trx) => {
            const folder = await this.folderRepo.findById(id, trx);
            if (!folder) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_FOUND', 'errors.assetFolderNotFound', { id }, 404);
            }
            if (folder.projectId !== projectId) {
                throw new domain_1.DomainError('ASSET_FOLDER_NOT_IN_PROJECT', 'errors.assetFolderNotInProject', { id }, 403);
            }
            const assets = await this.assetRepo.findByFolderId(id, trx);
            if (assets.length > 0) {
                throw new domain_1.DomainError('FOLDER_NOT_EMPTY', 'errors.folderNotEmpty', { id, assetCount: assets.length }, 409);
            }
            const childFolders = await this.folderRepo.findByParentId(id, folder.projectId, trx);
            if (childFolders.length > 0) {
                throw new domain_1.DomainError('FOLDER_HAS_CHILDREN', 'errors.folderHasChildren', { id, childCount: childFolders.length }, 409);
            }
            await this.folderRepo.delete(id, trx);
        });
    }
}
exports.DeleteAssetFolderUseCase = DeleteAssetFolderUseCase;
class UpdateAssetUseCase {
    assetRepo;
    uow;
    constructor(assetRepo, uow) {
        this.assetRepo = assetRepo;
        this.uow = uow;
    }
    async execute(projectId, id, changes) {
        return this.uow.execute(async (trx) => {
            const asset = await this.assetRepo.findById(id, trx);
            if (!asset) {
                throw new domain_1.DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
            }
            if (asset.projectId !== projectId) {
                throw new domain_1.DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
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
exports.UpdateAssetUseCase = UpdateAssetUseCase;
class GetAssetContentUseCase {
    assetRepo;
    fileStorage;
    constructor(assetRepo, fileStorage) {
        this.assetRepo = assetRepo;
        this.fileStorage = fileStorage;
    }
    async execute(projectId, id) {
        const asset = await this.assetRepo.findById(id);
        if (!asset) {
            throw new domain_1.DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
        }
        if (asset.projectId !== projectId) {
            throw new domain_1.DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
        }
        const buffer = await this.fileStorage.get(asset.path);
        return { buffer, mimeType: asset.mimeType, size: buffer.length };
    }
}
exports.GetAssetContentUseCase = GetAssetContentUseCase;
class GetAssetThumbnailUseCase {
    assetRepo;
    fileStorage;
    constructor(assetRepo, fileStorage) {
        this.assetRepo = assetRepo;
        this.fileStorage = fileStorage;
    }
    async execute(projectId, id) {
        const asset = await this.assetRepo.findById(id);
        if (!asset) {
            throw new domain_1.DomainError('ASSET_NOT_FOUND', 'errors.assetNotFound', { id }, 404);
        }
        if (asset.projectId !== projectId) {
            throw new domain_1.DomainError('ASSET_NOT_IN_PROJECT', 'errors.assetNotInProject', { id }, 403);
        }
        const thumbnailPath = asset.metadata['thumbnailPath'];
        if (!thumbnailPath) {
            throw new domain_1.DomainError('THUMBNAIL_NOT_AVAILABLE', 'errors.thumbnailNotAvailable', { id }, 404);
        }
        const buffer = await this.fileStorage.get(thumbnailPath);
        return { buffer, mimeType: 'image/jpeg' };
    }
}
exports.GetAssetThumbnailUseCase = GetAssetThumbnailUseCase;
// --- TAGS ---
class CreateTagUseCase {
    tagRepo;
    uow;
    constructor(tagRepo, uow) {
        this.tagRepo = tagRepo;
        this.uow = uow;
    }
    async execute(projectId, name) {
        const normalized = name.trim();
        if (!normalized) {
            throw new domain_1.DomainError('INVALID_TAG_NAME', 'errors.invalidTagName', { name }, 400);
        }
        const existing = await this.tagRepo.findByNames(projectId, [normalized]);
        if (existing.length > 0) {
            throw new domain_1.DomainError('TAG_ALREADY_EXISTS', 'errors.tagAlreadyExists', { name: normalized }, 409);
        }
        return this.uow.execute(async (trx) => {
            const now = new Date();
            const tag = {
                id: (0, domain_1.generateGuid)(),
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
exports.CreateTagUseCase = CreateTagUseCase;
class ListTagsUseCase {
    tagRepo;
    constructor(tagRepo) {
        this.tagRepo = tagRepo;
    }
    execute(projectId) {
        return this.tagRepo.findByProjectId(projectId);
    }
}
exports.ListTagsUseCase = ListTagsUseCase;
class DeleteTagUseCase {
    tagRepo;
    goTagRepo;
    uow;
    constructor(tagRepo, goTagRepo, uow) {
        this.tagRepo = tagRepo;
        this.goTagRepo = goTagRepo;
        this.uow = uow;
    }
    async execute(projectId, id) {
        return this.uow.execute(async (trx) => {
            const tag = await this.tagRepo.findById(id, trx);
            if (!tag) {
                throw new domain_1.DomainError('TAG_NOT_FOUND', 'errors.tagNotFound', { id }, 404);
            }
            if (tag.projectId !== projectId) {
                throw new domain_1.DomainError('TAG_NOT_IN_PROJECT', 'errors.tagNotInProject', { id }, 403);
            }
            const mappings = await this.goTagRepo.findByTagId(id, trx);
            for (const mapping of mappings) {
                await this.goTagRepo.remove(mapping.gameObjectId, id, trx);
            }
            await this.tagRepo.delete(id, trx);
        });
    }
}
exports.DeleteTagUseCase = DeleteTagUseCase;
class AddTagToGameObjectUseCase {
    tagRepo;
    goTagRepo;
    uow;
    constructor(tagRepo, goTagRepo, uow) {
        this.tagRepo = tagRepo;
        this.goTagRepo = goTagRepo;
        this.uow = uow;
    }
    async execute(projectId, gameObjectId, tagName) {
        const normalized = tagName.trim();
        if (!normalized) {
            throw new domain_1.DomainError('INVALID_TAG_NAME', 'errors.invalidTagName', { name: tagName }, 400);
        }
        return this.uow.execute(async (trx) => {
            const existingTags = await this.tagRepo.findByNames(projectId, [normalized], trx);
            let tag = existingTags[0] ?? null;
            if (!tag) {
                const now = new Date();
                tag = {
                    id: (0, domain_1.generateGuid)(),
                    projectId,
                    name: normalized,
                    createdAt: now,
                    updatedAt: now,
                };
                await this.tagRepo.save(tag, trx);
            }
            const mapping = {
                gameObjectId,
                tagId: tag.id,
                createdAt: new Date(),
            };
            await this.goTagRepo.add(gameObjectId, tag.id, trx);
            return mapping;
        });
    }
}
exports.AddTagToGameObjectUseCase = AddTagToGameObjectUseCase;
class RemoveTagFromGameObjectUseCase {
    goTagRepo;
    uow;
    constructor(goTagRepo, uow) {
        this.goTagRepo = goTagRepo;
        this.uow = uow;
    }
    async execute(gameObjectId, tagId) {
        await this.uow.execute(async (trx) => {
            await this.goTagRepo.remove(gameObjectId, tagId, trx);
        });
    }
}
exports.RemoveTagFromGameObjectUseCase = RemoveTagFromGameObjectUseCase;
class ListGameObjectTagsUseCase {
    goTagRepo;
    tagRepo;
    constructor(goTagRepo, tagRepo) {
        this.goTagRepo = goTagRepo;
        this.tagRepo = tagRepo;
    }
    async execute(gameObjectId) {
        const mappings = await this.goTagRepo.findByGameObjectId(gameObjectId);
        const tags = [];
        for (const mapping of mappings) {
            const tag = await this.tagRepo.findById(mapping.tagId);
            if (tag) {
                tags.push(tag);
            }
        }
        return tags;
    }
}
exports.ListGameObjectTagsUseCase = ListGameObjectTagsUseCase;
// --- RELATIONS ---
class CreateRelationUseCase {
    relationRepo;
    goRepo;
    uow;
    constructor(relationRepo, goRepo, uow) {
        this.relationRepo = relationRepo;
        this.goRepo = goRepo;
        this.uow = uow;
    }
    async execute(projectId, sourceGameObjectId, targetGameObjectId, type) {
        if (!type.trim()) {
            throw new domain_1.DomainError('INVALID_RELATION_TYPE', 'errors.invalidRelationType', { type }, 400);
        }
        const source = await this.goRepo.findById(sourceGameObjectId);
        if (!source) {
            throw new domain_1.DomainError('GAME_OBJECT_NOT_FOUND', 'errors.gameObjectNotFound', { id: sourceGameObjectId }, 404);
        }
        if (source.projectId !== projectId) {
            throw new domain_1.DomainError('GAME_OBJECT_NOT_IN_PROJECT', 'errors.gameObjectNotInProject', { id: sourceGameObjectId }, 403);
        }
        const target = await this.goRepo.findById(targetGameObjectId);
        if (!target) {
            throw new domain_1.DomainError('GAME_OBJECT_NOT_FOUND', 'errors.gameObjectNotFound', { id: targetGameObjectId }, 404);
        }
        if (target.projectId !== projectId) {
            throw new domain_1.DomainError('GAME_OBJECT_NOT_IN_PROJECT', 'errors.gameObjectNotInProject', { id: targetGameObjectId }, 403);
        }
        return this.uow.execute(async (trx) => {
            const now = new Date();
            const relation = {
                id: (0, domain_1.generateGuid)(),
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
exports.CreateRelationUseCase = CreateRelationUseCase;
class ListRelationsUseCase {
    relationRepo;
    constructor(relationRepo) {
        this.relationRepo = relationRepo;
    }
    execute(projectId) {
        return this.relationRepo.findByProjectId(projectId);
    }
}
exports.ListRelationsUseCase = ListRelationsUseCase;
class ListGameObjectRelationsUseCase {
    relationRepo;
    constructor(relationRepo) {
        this.relationRepo = relationRepo;
    }
    async execute(gameObjectId) {
        const outgoing = await this.relationRepo.findBySourceGameObjectId(gameObjectId);
        const incoming = await this.relationRepo.findByTargetGameObjectId(gameObjectId);
        return [...outgoing, ...incoming];
    }
}
exports.ListGameObjectRelationsUseCase = ListGameObjectRelationsUseCase;
class DeleteRelationUseCase {
    relationRepo;
    uow;
    constructor(relationRepo, uow) {
        this.relationRepo = relationRepo;
        this.uow = uow;
    }
    async execute(projectId, id) {
        return this.uow.execute(async (trx) => {
            const relation = await this.relationRepo.findById(id, trx);
            if (!relation) {
                throw new domain_1.DomainError('RELATION_NOT_FOUND', 'errors.relationNotFound', { id }, 404);
            }
            if (relation.projectId !== projectId) {
                throw new domain_1.DomainError('RELATION_NOT_IN_PROJECT', 'errors.relationNotInProject', { id }, 403);
            }
            await this.relationRepo.delete(id, trx);
        });
    }
}
exports.DeleteRelationUseCase = DeleteRelationUseCase;
// --- REFERENCES (markdown [[GameObject]]) ---
class SyncBlockReferencesUseCase {
    referenceRepo;
    goRepo;
    uow;
    constructor(referenceRepo, goRepo, uow) {
        this.referenceRepo = referenceRepo;
        this.goRepo = goRepo;
        this.uow = uow;
    }
    async execute(blockId, projectId, content) {
        const parsed = (0, markdown_references_1.parseMarkdownReferences)(content);
        return this.uow.execute(async (trx) => {
            await this.referenceRepo.deleteBySourceBlockId(blockId, trx);
            const references = [];
            for (const ref of parsed) {
                const target = await this.goRepo.findByName(projectId, ref.name, trx);
                if (!target) {
                    continue;
                }
                const reference = {
                    id: (0, domain_1.generateGuid)(),
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
exports.SyncBlockReferencesUseCase = SyncBlockReferencesUseCase;
class GetBacklinksUseCase {
    referenceRepo;
    blockRepo;
    pageRepo;
    constructor(referenceRepo, blockRepo, pageRepo) {
        this.referenceRepo = referenceRepo;
        this.blockRepo = blockRepo;
        this.pageRepo = pageRepo;
    }
    async execute(projectId, gameObjectId) {
        const references = await this.referenceRepo.findByTargetGameObjectId(gameObjectId);
        const backlinks = [];
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
exports.GetBacklinksUseCase = GetBacklinksUseCase;
class ResolveReferencesUseCase {
    goRepo;
    constructor(goRepo) {
        this.goRepo = goRepo;
    }
    async execute(projectId, query, limit = 20) {
        return this.goRepo.searchByName(projectId, query, limit);
    }
}
exports.ResolveReferencesUseCase = ResolveReferencesUseCase;
// --- SEARCH INDEX ---
class SearchUseCase {
    searchIndexRepo;
    constructor(searchIndexRepo) {
        this.searchIndexRepo = searchIndexRepo;
    }
    async execute(projectId, query, limit = 20) {
        return this.searchIndexRepo.search(projectId, query, limit);
    }
}
exports.SearchUseCase = SearchUseCase;
//# sourceMappingURL=use-cases.js.map