import { Project, GameObject, Block, BlockType, Guid, Asset, AssetFolder, Tag, GameObjectTag, Relation, Reference } from '@taleorience/domain';
import { ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, UnitOfWork, AssetRepository, AssetFolderRepository, FileStorage, ThumbnailGenerator, TagRepository, GameObjectTagRepository, RelationRepository, ReferenceRepository, SearchIndexRepository } from './ports';
export declare class CreateProjectUseCase {
    private readonly repo;
    private readonly uow;
    constructor(repo: ProjectRepository, uow: UnitOfWork);
    execute(name: string, description: string): Promise<Project>;
}
export declare class GetProjectUseCase {
    private readonly repo;
    constructor(repo: ProjectRepository);
    execute(id: Guid): Promise<Project>;
}
export declare class ListProjectsUseCase {
    private readonly repo;
    constructor(repo: ProjectRepository);
    execute(): Promise<Project[]>;
}
export declare class DeleteProjectUseCase {
    private readonly repo;
    private readonly uow;
    constructor(repo: ProjectRepository, uow: UnitOfWork);
    execute(id: Guid): Promise<void>;
}
export declare class CreateGameObjectUseCase {
    private readonly goRepo;
    private readonly pageRepo;
    private readonly uow;
    constructor(goRepo: GameObjectRepository, pageRepo: PageRepository, uow: UnitOfWork);
    execute(projectId: Guid, name: string, parentId?: Guid | null): Promise<GameObject>;
}
export declare class DeleteGameObjectUseCase {
    private readonly goRepo;
    private readonly pageRepo;
    private readonly blockRepo;
    private readonly uow;
    constructor(goRepo: GameObjectRepository, pageRepo: PageRepository, blockRepo: BlockRepository, uow: UnitOfWork);
    execute(id: Guid): Promise<void>;
}
export declare class CreateBlockUseCase {
    private readonly repo;
    private readonly referenceRepo;
    private readonly goRepo;
    private readonly searchIndexRepo;
    private readonly uow;
    constructor(repo: BlockRepository, referenceRepo: ReferenceRepository, goRepo: GameObjectRepository, searchIndexRepo: SearchIndexRepository, uow: UnitOfWork);
    execute(projectId: Guid, pageId: Guid, type: BlockType, data: Record<string, unknown>): Promise<Block>;
    private syncReferences;
    private reindexBlock;
    private blockToText;
    private validateBlockData;
}
export declare class UpdateBlockUseCase {
    private readonly repo;
    private readonly referenceRepo;
    private readonly goRepo;
    private readonly searchIndexRepo;
    private readonly uow;
    constructor(repo: BlockRepository, referenceRepo: ReferenceRepository, goRepo: GameObjectRepository, searchIndexRepo: SearchIndexRepository, uow: UnitOfWork);
    execute(id: Guid, data: Record<string, unknown>): Promise<Block>;
    private validateBlockData;
    private syncReferences;
    private reindexBlock;
    private blockToText;
}
export declare class UploadAssetUseCase {
    private readonly assetRepo;
    private readonly folderRepo;
    private readonly fileStorage;
    private readonly thumbnailGenerator;
    private readonly uow;
    constructor(assetRepo: AssetRepository, folderRepo: AssetFolderRepository, fileStorage: FileStorage, thumbnailGenerator: ThumbnailGenerator, uow: UnitOfWork);
    execute(projectId: Guid, file: {
        buffer: Buffer;
        originalName: string;
        mimeType: string;
        size: number;
    }, folderId?: Guid | null): Promise<Asset>;
    private validateFile;
    private sanitizeFileName;
    private isValidFileName;
    private getAssetType;
    private getImageDimensions;
}
export declare class GetAssetUseCase {
    private readonly assetRepo;
    constructor(assetRepo: AssetRepository);
    execute(projectId: Guid, id: Guid): Promise<Asset>;
}
export declare class ListAssetsUseCase {
    private readonly assetRepo;
    private readonly folderRepo;
    constructor(assetRepo: AssetRepository, folderRepo: AssetFolderRepository);
    execute(projectId: Guid, folderId?: Guid | null): Promise<Asset[]>;
}
export declare class DeleteAssetUseCase {
    private readonly assetRepo;
    private readonly fileStorage;
    private readonly uow;
    constructor(assetRepo: AssetRepository, fileStorage: FileStorage, uow: UnitOfWork);
    execute(projectId: Guid, id: Guid): Promise<void>;
}
export declare class CreateAssetFolderUseCase {
    private readonly folderRepo;
    private readonly uow;
    constructor(folderRepo: AssetFolderRepository, uow: UnitOfWork);
    execute(projectId: Guid, name: string, parentId?: Guid | null): Promise<AssetFolder>;
}
export declare class ListAssetFoldersUseCase {
    private readonly folderRepo;
    constructor(folderRepo: AssetFolderRepository);
    execute(projectId: Guid, parentId?: Guid | null): Promise<AssetFolder[]>;
}
export declare class DeleteAssetFolderUseCase {
    private readonly folderRepo;
    private readonly assetRepo;
    private readonly uow;
    constructor(folderRepo: AssetFolderRepository, assetRepo: AssetRepository, uow: UnitOfWork);
    execute(projectId: Guid, id: Guid): Promise<void>;
}
export declare class UpdateAssetUseCase {
    private readonly assetRepo;
    private readonly uow;
    constructor(assetRepo: AssetRepository, uow: UnitOfWork);
    execute(projectId: Guid, id: Guid, changes: {
        folderId?: Guid | null;
        metadata?: Record<string, unknown>;
    }): Promise<Asset>;
}
export declare class GetAssetContentUseCase {
    private readonly assetRepo;
    private readonly fileStorage;
    constructor(assetRepo: AssetRepository, fileStorage: FileStorage);
    execute(projectId: Guid, id: Guid): Promise<{
        buffer: Buffer;
        mimeType: string;
        size: number;
    }>;
}
export declare class GetAssetThumbnailUseCase {
    private readonly assetRepo;
    private readonly fileStorage;
    constructor(assetRepo: AssetRepository, fileStorage: FileStorage);
    execute(projectId: Guid, id: Guid): Promise<{
        buffer: Buffer;
        mimeType: string;
    }>;
}
export declare class CreateTagUseCase {
    private readonly tagRepo;
    private readonly uow;
    constructor(tagRepo: TagRepository, uow: UnitOfWork);
    execute(projectId: Guid, name: string): Promise<Tag>;
}
export declare class ListTagsUseCase {
    private readonly tagRepo;
    constructor(tagRepo: TagRepository);
    execute(projectId: Guid): Promise<Tag[]>;
}
export declare class DeleteTagUseCase {
    private readonly tagRepo;
    private readonly goTagRepo;
    private readonly uow;
    constructor(tagRepo: TagRepository, goTagRepo: GameObjectTagRepository, uow: UnitOfWork);
    execute(projectId: Guid, id: Guid): Promise<void>;
}
export declare class AddTagToGameObjectUseCase {
    private readonly tagRepo;
    private readonly goTagRepo;
    private readonly uow;
    constructor(tagRepo: TagRepository, goTagRepo: GameObjectTagRepository, uow: UnitOfWork);
    execute(projectId: Guid, gameObjectId: Guid, tagName: string): Promise<GameObjectTag>;
}
export declare class RemoveTagFromGameObjectUseCase {
    private readonly goTagRepo;
    private readonly uow;
    constructor(goTagRepo: GameObjectTagRepository, uow: UnitOfWork);
    execute(gameObjectId: Guid, tagId: Guid): Promise<void>;
}
export declare class ListGameObjectTagsUseCase {
    private readonly goTagRepo;
    private readonly tagRepo;
    constructor(goTagRepo: GameObjectTagRepository, tagRepo: TagRepository);
    execute(gameObjectId: Guid): Promise<Tag[]>;
}
export declare class CreateRelationUseCase {
    private readonly relationRepo;
    private readonly goRepo;
    private readonly uow;
    constructor(relationRepo: RelationRepository, goRepo: GameObjectRepository, uow: UnitOfWork);
    execute(projectId: Guid, sourceGameObjectId: Guid, targetGameObjectId: Guid, type: string): Promise<Relation>;
}
export declare class ListRelationsUseCase {
    private readonly relationRepo;
    constructor(relationRepo: RelationRepository);
    execute(projectId: Guid): Promise<Relation[]>;
}
export declare class ListGameObjectRelationsUseCase {
    private readonly relationRepo;
    constructor(relationRepo: RelationRepository);
    execute(gameObjectId: Guid): Promise<Relation[]>;
}
export declare class DeleteRelationUseCase {
    private readonly relationRepo;
    private readonly uow;
    constructor(relationRepo: RelationRepository, uow: UnitOfWork);
    execute(projectId: Guid, id: Guid): Promise<void>;
}
export declare class SyncBlockReferencesUseCase {
    private readonly referenceRepo;
    private readonly goRepo;
    private readonly uow;
    constructor(referenceRepo: ReferenceRepository, goRepo: GameObjectRepository, uow: UnitOfWork);
    execute(blockId: Guid, projectId: Guid, content: string): Promise<Reference[]>;
}
export declare class GetBacklinksUseCase {
    private readonly referenceRepo;
    private readonly blockRepo;
    private readonly pageRepo;
    constructor(referenceRepo: ReferenceRepository, blockRepo: BlockRepository, pageRepo: PageRepository);
    execute(projectId: Guid, gameObjectId: Guid): Promise<Array<{
        referenceId: Guid;
        blockId: Guid;
        pageId: Guid;
        pageTitle: string;
        label: string | null;
    }>>;
}
export declare class ResolveReferencesUseCase {
    private readonly goRepo;
    constructor(goRepo: GameObjectRepository);
    execute(projectId: Guid, query: string, limit?: number): Promise<GameObject[]>;
}
export declare class SearchUseCase {
    private readonly searchIndexRepo;
    constructor(searchIndexRepo: SearchIndexRepository);
    execute(projectId: Guid, query: string, limit?: number): Promise<import('./ports').SearchIndexEntry[]>;
}
//# sourceMappingURL=use-cases.d.ts.map