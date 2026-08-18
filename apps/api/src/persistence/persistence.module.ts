import { Global, Module } from '@nestjs/common';
import type { Db } from '@taleorience/infrastructure';
import {
  SqlProjectRepository,
  SqlGameObjectRepository,
  SqlPageRepository,
  SqlBlockRepository,
  DrizzleUnitOfWork,
} from '@taleorience/infrastructure';
import {
  DB_CONNECTION,
  PROJECT_REPOSITORY,
  GAME_OBJECT_REPOSITORY,
  PAGE_REPOSITORY,
  BLOCK_REPOSITORY,
  UNIT_OF_WORK,
} from '../modules/tokens';

@Global()
@Module({
  providers: [
    {
      provide: PROJECT_REPOSITORY,
      useFactory: (db: Db) => new SqlProjectRepository(db),
      inject: [DB_CONNECTION],
    },
    {
      provide: GAME_OBJECT_REPOSITORY,
      useFactory: (db: Db) => new SqlGameObjectRepository(db),
      inject: [DB_CONNECTION],
    },
    {
      provide: PAGE_REPOSITORY,
      useFactory: (db: Db) => new SqlPageRepository(db),
      inject: [DB_CONNECTION],
    },
    {
      provide: BLOCK_REPOSITORY,
      useFactory: (db: Db) => new SqlBlockRepository(db),
      inject: [DB_CONNECTION],
    },
    {
      provide: UNIT_OF_WORK,
      useFactory: (db: Db) => new DrizzleUnitOfWork(db),
      inject: [DB_CONNECTION],
    },
  ],
  exports: [
    PROJECT_REPOSITORY,
    GAME_OBJECT_REPOSITORY,
    PAGE_REPOSITORY,
    BLOCK_REPOSITORY,
    UNIT_OF_WORK,
  ],
})
export class PersistenceModule {}
