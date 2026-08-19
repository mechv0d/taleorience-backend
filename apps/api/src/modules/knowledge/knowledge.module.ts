import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import {
  CreateTagUseCase,
  ListTagsUseCase,
  DeleteTagUseCase,
  AddTagToGameObjectUseCase,
  RemoveTagFromGameObjectUseCase,
  ListGameObjectTagsUseCase,
  CreateRelationUseCase,
  ListRelationsUseCase,
  DeleteRelationUseCase,
  GetBacklinksUseCase,
  ResolveReferencesUseCase,
  SearchUseCase,
  TagRepository,
  GameObjectTagRepository,
  RelationRepository,
  ReferenceRepository,
  SearchIndexRepository,
  GameObjectRepository,
  BlockRepository,
  PageRepository,
  UnitOfWork,
} from '@taleorience/application';
import {
  TAG_REPOSITORY,
  GAME_OBJECT_TAG_REPOSITORY,
  RELATION_REPOSITORY,
  REFERENCE_REPOSITORY,
  SEARCH_INDEX_REPOSITORY,
  GAME_OBJECT_REPOSITORY,
  BLOCK_REPOSITORY,
  PAGE_REPOSITORY,
  UNIT_OF_WORK,
} from '../tokens';

@Module({
  controllers: [KnowledgeController],
  providers: [
    {
      provide: CreateTagUseCase,
      useFactory: (tagRepo: TagRepository, uow: UnitOfWork) =>
        new CreateTagUseCase(tagRepo, uow),
      inject: [TAG_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: ListTagsUseCase,
      useFactory: (tagRepo: TagRepository) => new ListTagsUseCase(tagRepo),
      inject: [TAG_REPOSITORY],
    },
    {
      provide: DeleteTagUseCase,
      useFactory: (
        tagRepo: TagRepository,
        goTagRepo: GameObjectTagRepository,
        uow: UnitOfWork,
      ) => new DeleteTagUseCase(tagRepo, goTagRepo, uow),
      inject: [TAG_REPOSITORY, GAME_OBJECT_TAG_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: AddTagToGameObjectUseCase,
      useFactory: (
        tagRepo: TagRepository,
        goTagRepo: GameObjectTagRepository,
        uow: UnitOfWork,
      ) => new AddTagToGameObjectUseCase(tagRepo, goTagRepo, uow),
      inject: [TAG_REPOSITORY, GAME_OBJECT_TAG_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: RemoveTagFromGameObjectUseCase,
      useFactory: (goTagRepo: GameObjectTagRepository, uow: UnitOfWork) =>
        new RemoveTagFromGameObjectUseCase(goTagRepo, uow),
      inject: [GAME_OBJECT_TAG_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: ListGameObjectTagsUseCase,
      useFactory: (
        goTagRepo: GameObjectTagRepository,
        tagRepo: TagRepository,
      ) => new ListGameObjectTagsUseCase(goTagRepo, tagRepo),
      inject: [GAME_OBJECT_TAG_REPOSITORY, TAG_REPOSITORY],
    },
    {
      provide: CreateRelationUseCase,
      useFactory: (
        relationRepo: RelationRepository,
        goRepo: GameObjectRepository,
        uow: UnitOfWork,
      ) => new CreateRelationUseCase(relationRepo, goRepo, uow),
      inject: [RELATION_REPOSITORY, GAME_OBJECT_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: ListRelationsUseCase,
      useFactory: (relationRepo: RelationRepository) =>
        new ListRelationsUseCase(relationRepo),
      inject: [RELATION_REPOSITORY],
    },
    {
      provide: DeleteRelationUseCase,
      useFactory: (relationRepo: RelationRepository, uow: UnitOfWork) =>
        new DeleteRelationUseCase(relationRepo, uow),
      inject: [RELATION_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: GetBacklinksUseCase,
      useFactory: (
        referenceRepo: ReferenceRepository,
        blockRepo: BlockRepository,
        pageRepo: PageRepository,
      ) => new GetBacklinksUseCase(referenceRepo, blockRepo, pageRepo),
      inject: [REFERENCE_REPOSITORY, BLOCK_REPOSITORY, PAGE_REPOSITORY],
    },
    {
      provide: ResolveReferencesUseCase,
      useFactory: (goRepo: GameObjectRepository) =>
        new ResolveReferencesUseCase(goRepo),
      inject: [GAME_OBJECT_REPOSITORY],
    },
    {
      provide: SearchUseCase,
      useFactory: (searchIndexRepo: SearchIndexRepository) =>
        new SearchUseCase(searchIndexRepo),
      inject: [SEARCH_INDEX_REPOSITORY],
    },
  ],
})
export class KnowledgeModule {}
