import { Module } from '@nestjs/common';
import { WorldController } from './world.controller';
import {
  CreateGameObjectUseCase,
  CreateBlockUseCase,
  UpdateBlockUseCase,
  DeleteGameObjectUseCase,
  ListGameObjectsUseCase,
  GetGameObjectTreeUseCase,
  ListPageBlocksUseCase,
  GetBlockUseCase,
  DeleteBlockUseCase,
  MoveBlockUseCase,
  DuplicateBlockUseCase,
  GameObjectRepository,
  PageRepository,
  BlockRepository,
  ReferenceRepository,
  SearchIndexRepository,
  UnitOfWork,
} from '@taleorience/application';
import {
  GAME_OBJECT_REPOSITORY,
  PAGE_REPOSITORY,
  BLOCK_REPOSITORY,
  REFERENCE_REPOSITORY,
  SEARCH_INDEX_REPOSITORY,
  UNIT_OF_WORK,
} from '../tokens';

@Module({
  controllers: [WorldController],
  providers: [
    {
      provide: CreateGameObjectUseCase,
      useFactory: (
        goRepo: GameObjectRepository,
        pageRepo: PageRepository,
        uow: UnitOfWork,
      ) => new CreateGameObjectUseCase(goRepo, pageRepo, uow),
      inject: [GAME_OBJECT_REPOSITORY, PAGE_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: DeleteGameObjectUseCase,
      useFactory: (
        goRepo: GameObjectRepository,
        pageRepo: PageRepository,
        blockRepo: BlockRepository,
        uow: UnitOfWork,
      ) => new DeleteGameObjectUseCase(goRepo, pageRepo, blockRepo, uow),
      inject: [
        GAME_OBJECT_REPOSITORY,
        PAGE_REPOSITORY,
        BLOCK_REPOSITORY,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: CreateBlockUseCase,
      useFactory: (
        repo: BlockRepository,
        refRepo: ReferenceRepository,
        goRepo: GameObjectRepository,
        searchIndexRepo: SearchIndexRepository,
        uow: UnitOfWork,
      ) => new CreateBlockUseCase(repo, refRepo, goRepo, searchIndexRepo, uow),
      inject: [
        BLOCK_REPOSITORY,
        REFERENCE_REPOSITORY,
        GAME_OBJECT_REPOSITORY,
        SEARCH_INDEX_REPOSITORY,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: UpdateBlockUseCase,
      useFactory: (
        repo: BlockRepository,
        refRepo: ReferenceRepository,
        goRepo: GameObjectRepository,
        searchIndexRepo: SearchIndexRepository,
        uow: UnitOfWork,
      ) => new UpdateBlockUseCase(repo, refRepo, goRepo, searchIndexRepo, uow),
      inject: [
        BLOCK_REPOSITORY,
        REFERENCE_REPOSITORY,
        GAME_OBJECT_REPOSITORY,
        SEARCH_INDEX_REPOSITORY,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: ListGameObjectsUseCase,
      useFactory: (goRepo: GameObjectRepository) =>
        new ListGameObjectsUseCase(goRepo),
      inject: [GAME_OBJECT_REPOSITORY],
    },
    {
      provide: GetGameObjectTreeUseCase,
      useFactory: (goRepo: GameObjectRepository) =>
        new GetGameObjectTreeUseCase(goRepo),
      inject: [GAME_OBJECT_REPOSITORY],
    },
    {
      provide: ListPageBlocksUseCase,
      useFactory: (repo: BlockRepository) => new ListPageBlocksUseCase(repo),
      inject: [BLOCK_REPOSITORY],
    },
    {
      provide: GetBlockUseCase,
      useFactory: (repo: BlockRepository) => new GetBlockUseCase(repo),
      inject: [BLOCK_REPOSITORY],
    },
    {
      provide: DeleteBlockUseCase,
      useFactory: (
        repo: BlockRepository,
        refRepo: ReferenceRepository,
        searchIndexRepo: SearchIndexRepository,
        uow: UnitOfWork,
      ) => new DeleteBlockUseCase(repo, refRepo, searchIndexRepo, uow),
      inject: [
        BLOCK_REPOSITORY,
        REFERENCE_REPOSITORY,
        SEARCH_INDEX_REPOSITORY,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: MoveBlockUseCase,
      useFactory: (repo: BlockRepository, uow: UnitOfWork) =>
        new MoveBlockUseCase(repo, uow),
      inject: [BLOCK_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: DuplicateBlockUseCase,
      useFactory: (
        repo: BlockRepository,
        refRepo: ReferenceRepository,
        goRepo: GameObjectRepository,
        searchIndexRepo: SearchIndexRepository,
        uow: UnitOfWork,
      ) =>
        new DuplicateBlockUseCase(repo, refRepo, goRepo, searchIndexRepo, uow),
      inject: [
        BLOCK_REPOSITORY,
        REFERENCE_REPOSITORY,
        GAME_OBJECT_REPOSITORY,
        SEARCH_INDEX_REPOSITORY,
        UNIT_OF_WORK,
      ],
    },
  ],
})
export class WorldModule {}
