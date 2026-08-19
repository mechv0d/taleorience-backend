import { Global, Module } from '@nestjs/common';
import type { Db, PgDb } from '@taleorience/infrastructure';
import {
  SqlProjectRepository,
  SqlGameObjectRepository,
  SqlPageRepository,
  SqlBlockRepository,
  SqlAssetRepository,
  SqlAssetFolderRepository,
  SqlTagRepository,
  SqlGameObjectTagRepository,
  SqlRelationRepository,
  SqlReferenceRepository,
  SqlSearchIndexRepository,
  DrizzleUnitOfWork,
  PgProjectRepository,
  PgGameObjectRepository,
  PgPageRepository,
  PgBlockRepository,
  PgAssetRepository,
  PgAssetFolderRepository,
  PgTagRepository,
  PgGameObjectTagRepository,
  PgRelationRepository,
  PgReferenceRepository,
  PgSearchIndexRepository,
  PgUnitOfWork,
} from '@taleorience/infrastructure';
import {
  DB_CONNECTION,
  PROJECT_REPOSITORY,
  GAME_OBJECT_REPOSITORY,
  PAGE_REPOSITORY,
  BLOCK_REPOSITORY,
  ASSET_REPOSITORY,
  ASSET_FOLDER_REPOSITORY,
  TAG_REPOSITORY,
  GAME_OBJECT_TAG_REPOSITORY,
  RELATION_REPOSITORY,
  REFERENCE_REPOSITORY,
  SEARCH_INDEX_REPOSITORY,
  UNIT_OF_WORK,
} from '../modules/tokens';
import { DatabaseConnection } from '../database/database.module';
import { AppConfigService } from '../config/app-config.service';

const isPostgres = (config: AppConfigService) =>
  config.databaseProvider === 'postgres';

@Global()
@Module({
  providers: [
    {
      provide: PROJECT_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgProjectRepository(db as PgDb)
          : new SqlProjectRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: GAME_OBJECT_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgGameObjectRepository(db as PgDb)
          : new SqlGameObjectRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: PAGE_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgPageRepository(db as PgDb)
          : new SqlPageRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: BLOCK_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgBlockRepository(db as PgDb)
          : new SqlBlockRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: ASSET_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgAssetRepository(db as PgDb)
          : new SqlAssetRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: ASSET_FOLDER_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgAssetFolderRepository(db as PgDb)
          : new SqlAssetFolderRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: TAG_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgTagRepository(db as PgDb)
          : new SqlTagRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: GAME_OBJECT_TAG_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgGameObjectTagRepository(db as PgDb)
          : new SqlGameObjectTagRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: RELATION_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgRelationRepository(db as PgDb)
          : new SqlRelationRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: REFERENCE_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgReferenceRepository(db as PgDb)
          : new SqlReferenceRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: SEARCH_INDEX_REPOSITORY,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgSearchIndexRepository(db as PgDb)
          : new SqlSearchIndexRepository(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
    {
      provide: UNIT_OF_WORK,
      useFactory: (db: DatabaseConnection, config: AppConfigService) =>
        isPostgres(config)
          ? new PgUnitOfWork(db as PgDb)
          : new DrizzleUnitOfWork(db as Db),
      inject: [DB_CONNECTION, AppConfigService],
    },
  ],
  exports: [
    PROJECT_REPOSITORY,
    GAME_OBJECT_REPOSITORY,
    PAGE_REPOSITORY,
    BLOCK_REPOSITORY,
    ASSET_REPOSITORY,
    ASSET_FOLDER_REPOSITORY,
    TAG_REPOSITORY,
    GAME_OBJECT_TAG_REPOSITORY,
    RELATION_REPOSITORY,
    REFERENCE_REPOSITORY,
    SEARCH_INDEX_REPOSITORY,
    UNIT_OF_WORK,
  ],
})
export class PersistenceModule {}
