import { Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  UploadAssetUseCase,
  GetAssetUseCase,
  ListAssetsUseCase,
  DeleteAssetUseCase,
  UpdateAssetUseCase,
  GetAssetContentUseCase,
  GetAssetThumbnailUseCase,
  CreateAssetFolderUseCase,
  ListAssetFoldersUseCase,
  DeleteAssetFolderUseCase,
  AssetRepository,
  AssetFolderRepository,
  FileStorage,
  ThumbnailGenerator,
  UnitOfWork,
} from '@taleorience/application';
import {
  LocalFileStorage,
  S3FileStorage,
  SharpThumbnailGenerator,
} from '@taleorience/infrastructure';
import {
  ASSET_REPOSITORY,
  ASSET_FOLDER_REPOSITORY,
  FILE_STORAGE,
  THUMBNAIL_GENERATOR,
  UNIT_OF_WORK,
} from '../tokens';
import { AssetsController, AssetFoldersController } from './assets.controller';

@Module({
  controllers: [AssetsController, AssetFoldersController],
  providers: [
    {
      provide: FILE_STORAGE,
      useFactory: (config: AppConfigService) => {
        if (config.storageDriver === 's3') {
          return new S3FileStorage({
            bucket: config.s3Bucket ?? '',
            region: config.s3Region,
            endpoint: config.s3Endpoint,
            accessKeyId: config.s3AccessKeyId,
            secretAccessKey: config.s3SecretAccessKey,
            forcePathStyle: config.s3ForcePathStyle,
          });
        }

        return new LocalFileStorage(config.storageRoot);
      },
      inject: [AppConfigService],
    },
    {
      provide: THUMBNAIL_GENERATOR,
      useFactory: () => new SharpThumbnailGenerator(),
    },
    {
      provide: UploadAssetUseCase,
      useFactory: (
        assetRepo: AssetRepository,
        folderRepo: AssetFolderRepository,
        fileStorage: FileStorage,
        thumbnailGenerator: ThumbnailGenerator,
        uow: UnitOfWork,
      ) =>
        new UploadAssetUseCase(
          assetRepo,
          folderRepo,
          fileStorage,
          thumbnailGenerator,
          uow,
        ),
      inject: [
        ASSET_REPOSITORY,
        ASSET_FOLDER_REPOSITORY,
        FILE_STORAGE,
        THUMBNAIL_GENERATOR,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: GetAssetUseCase,
      useFactory: (assetRepo: AssetRepository) =>
        new GetAssetUseCase(assetRepo),
      inject: [ASSET_REPOSITORY],
    },
    {
      provide: ListAssetsUseCase,
      useFactory: (
        assetRepo: AssetRepository,
        folderRepo: AssetFolderRepository,
      ) => new ListAssetsUseCase(assetRepo, folderRepo),
      inject: [ASSET_REPOSITORY, ASSET_FOLDER_REPOSITORY],
    },
    {
      provide: UpdateAssetUseCase,
      useFactory: (assetRepo: AssetRepository, uow: UnitOfWork) =>
        new UpdateAssetUseCase(assetRepo, uow),
      inject: [ASSET_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: DeleteAssetUseCase,
      useFactory: (
        assetRepo: AssetRepository,
        fileStorage: FileStorage,
        uow: UnitOfWork,
      ) => new DeleteAssetUseCase(assetRepo, fileStorage, uow),
      inject: [ASSET_REPOSITORY, FILE_STORAGE, UNIT_OF_WORK],
    },
    {
      provide: GetAssetContentUseCase,
      useFactory: (assetRepo: AssetRepository, fileStorage: FileStorage) =>
        new GetAssetContentUseCase(assetRepo, fileStorage),
      inject: [ASSET_REPOSITORY, FILE_STORAGE],
    },
    {
      provide: GetAssetThumbnailUseCase,
      useFactory: (assetRepo: AssetRepository, fileStorage: FileStorage) =>
        new GetAssetThumbnailUseCase(assetRepo, fileStorage),
      inject: [ASSET_REPOSITORY, FILE_STORAGE],
    },
    {
      provide: CreateAssetFolderUseCase,
      useFactory: (folderRepo: AssetFolderRepository, uow: UnitOfWork) =>
        new CreateAssetFolderUseCase(folderRepo, uow),
      inject: [ASSET_FOLDER_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: ListAssetFoldersUseCase,
      useFactory: (folderRepo: AssetFolderRepository) =>
        new ListAssetFoldersUseCase(folderRepo),
      inject: [ASSET_FOLDER_REPOSITORY],
    },
    {
      provide: DeleteAssetFolderUseCase,
      useFactory: (
        folderRepo: AssetFolderRepository,
        assetRepo: AssetRepository,
        uow: UnitOfWork,
      ) => new DeleteAssetFolderUseCase(folderRepo, assetRepo, uow),
      inject: [ASSET_FOLDER_REPOSITORY, ASSET_REPOSITORY, UNIT_OF_WORK],
    },
  ],
})
export class AssetsModule {}
