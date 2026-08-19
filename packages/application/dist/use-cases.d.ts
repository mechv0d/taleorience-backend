import { Project, GameObject, Block, BlockType, Guid, Asset, AssetFolder } from '@taleorience/domain';
import { ProjectRepository, GameObjectRepository, PageRepository, BlockRepository, UnitOfWork, AssetRepository, AssetFolderRepository, FileStorage, ThumbnailGenerator } from './ports';
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
    private readonly uow;
    constructor(repo: BlockRepository, uow: UnitOfWork);
    execute(projectId: Guid, pageId: Guid, type: BlockType, data: Record<string, unknown>): Promise<Block>;
    private validateBlockData;
}
export declare class UpdateBlockUseCase {
    private readonly repo;
    private readonly uow;
    constructor(repo: BlockRepository, uow: UnitOfWork);
    execute(id: Guid, data: Record<string, unknown>): Promise<Block>;
    private validateBlockData;
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
    execute(id: Guid): Promise<Asset>;
}
export declare class ListAssetsUseCase {
    private readonly assetRepo;
    constructor(assetRepo: AssetRepository);
    execute(projectId: Guid, folderId?: Guid | null): Promise<Asset[]>;
}
export declare class DeleteAssetUseCase {
    private readonly assetRepo;
    private readonly fileStorage;
    private readonly uow;
    constructor(assetRepo: AssetRepository, fileStorage: FileStorage, uow: UnitOfWork);
    execute(id: Guid): Promise<void>;
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
    execute(id: Guid): Promise<void>;
}
//# sourceMappingURL=use-cases.d.ts.map