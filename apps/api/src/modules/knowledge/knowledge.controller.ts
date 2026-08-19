import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import type {
  CreateTagDtoType,
  AddTagToGameObjectDtoType,
  CreateRelationDtoType,
  ResolveReferencesQueryDtoType,
  SearchQueryDtoType,
} from '@taleorience/contracts';
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
} from '@taleorience/application';

@Controller('projects/:projectId')
export class KnowledgeController {
  constructor(
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly listTagsUseCase: ListTagsUseCase,
    private readonly deleteTagUseCase: DeleteTagUseCase,
    private readonly addTagToGameObjectUseCase: AddTagToGameObjectUseCase,
    private readonly removeTagFromGameObjectUseCase: RemoveTagFromGameObjectUseCase,
    private readonly listGameObjectTagsUseCase: ListGameObjectTagsUseCase,
    private readonly createRelationUseCase: CreateRelationUseCase,
    private readonly listRelationsUseCase: ListRelationsUseCase,
    private readonly deleteRelationUseCase: DeleteRelationUseCase,
    private readonly getBacklinksUseCase: GetBacklinksUseCase,
    private readonly resolveReferencesUseCase: ResolveReferencesUseCase,
    private readonly searchUseCase: SearchUseCase,
  ) {}

  @Post('tags')
  createTag(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTagDtoType,
  ) {
    return this.createTagUseCase.execute(projectId, dto.name);
  }

  @Get('tags')
  listTags(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.listTagsUseCase.execute(projectId);
  }

  @Delete('tags/:tagId')
  async deleteTag(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    await this.deleteTagUseCase.execute(projectId, tagId);
    return { success: true };
  }

  @Post('game-objects/:goId/tags')
  addTagToGameObject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('goId', ParseUUIDPipe) goId: string,
    @Body() dto: AddTagToGameObjectDtoType,
  ) {
    return this.addTagToGameObjectUseCase.execute(projectId, goId, dto.name);
  }

  @Get('game-objects/:goId/tags')
  listGameObjectTags(@Param('goId', ParseUUIDPipe) goId: string) {
    return this.listGameObjectTagsUseCase.execute(goId);
  }

  @Delete('game-objects/:goId/tags/:tagId')
  async removeTagFromGameObject(
    @Param('goId', ParseUUIDPipe) goId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    await this.removeTagFromGameObjectUseCase.execute(goId, tagId);
    return { success: true };
  }

  @Post('game-objects/:goId/relations')
  createRelation(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('goId', ParseUUIDPipe) goId: string,
    @Body() dto: CreateRelationDtoType,
  ) {
    return this.createRelationUseCase.execute(
      projectId,
      goId,
      dto.targetGameObjectId,
      dto.type,
    );
  }

  @Get('relations')
  listRelations(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.listRelationsUseCase.execute(projectId);
  }

  @Delete('relations/:relationId')
  async deleteRelation(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('relationId', ParseUUIDPipe) relationId: string,
  ) {
    await this.deleteRelationUseCase.execute(projectId, relationId);
    return { success: true };
  }

  @Get('game-objects/:goId/backlinks')
  getBacklinks(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('goId', ParseUUIDPipe) goId: string,
  ) {
    return this.getBacklinksUseCase.execute(projectId, goId);
  }

  @Get('references/resolve')
  resolveReferences(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ResolveReferencesQueryDtoType,
  ) {
    return this.resolveReferencesUseCase.execute(
      projectId,
      query.q,
      query.limit ?? 20,
    );
  }

  @Get('search')
  search(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: SearchQueryDtoType,
  ) {
    return this.searchUseCase.execute(projectId, query.q, query.limit ?? 20);
  }
}
