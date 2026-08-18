import { Module } from '@nestjs/common';
import { WorldController } from './world.controller';
import { 
  CreateGameObjectUseCase, 
  CreateBlockUseCase, 
  UpdateBlockUseCase, 
  DeleteGameObjectUseCase,
  GameObjectRepository,
  PageRepository,
  BlockRepository,
  UnitOfWork
} from '@taleorience/application';
import { 
  GAME_OBJECT_REPOSITORY, 
  PAGE_REPOSITORY, 
  BLOCK_REPOSITORY, 
  UNIT_OF_WORK 
} from '../tokens';

@Module({
  controllers: [WorldController],
  providers: [
    {
      provide: CreateGameObjectUseCase,
      useFactory: (
        goRepo: GameObjectRepository, 
        pageRepo: PageRepository, 
        uow: UnitOfWork
      ) => new CreateGameObjectUseCase(goRepo, pageRepo, uow),
      inject: [GAME_OBJECT_REPOSITORY, PAGE_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: DeleteGameObjectUseCase,
      useFactory: (
        goRepo: GameObjectRepository, 
        pageRepo: PageRepository, 
        blockRepo: BlockRepository, 
        uow: UnitOfWork
      ) => new DeleteGameObjectUseCase(goRepo, pageRepo, blockRepo, uow),
      inject: [GAME_OBJECT_REPOSITORY, PAGE_REPOSITORY, BLOCK_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: CreateBlockUseCase,
      useFactory: (repo: BlockRepository, uow: UnitOfWork) => new CreateBlockUseCase(repo, uow),
      inject: [BLOCK_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: UpdateBlockUseCase,
      useFactory: (repo: BlockRepository, uow: UnitOfWork) => new UpdateBlockUseCase(repo, uow),
      inject: [BLOCK_REPOSITORY, UNIT_OF_WORK],
    },
  ],
})
export class WorldModule {}