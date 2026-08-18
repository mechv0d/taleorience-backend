import { Controller, Post, Get, Body, Param, ParseUUIDPipe, Inject } from '@nestjs/common';
import type { 
  CreateGameObjectDtoType, 
  CreateBlockDtoType, 
  UpdateBlockDtoType 
} from '@taleorience/contracts';
import { BlockType } from '@taleorience/domain';
import { 
  CreateGameObjectUseCase, 
  CreateBlockUseCase, 
  UpdateBlockUseCase, 
  DeleteGameObjectUseCase 
} from '@taleorience/application';
import type { PageRepository, BlockRepository } from '@taleorience/application';
import { PAGE_REPOSITORY, BLOCK_REPOSITORY } from '../tokens';

@Controller('projects/:projectId')
export class WorldController {
  constructor(
    // 1. Переименовываем свойства, чтобы они не конфликтовали с именами методов
    private readonly createGameObjectUseCase: CreateGameObjectUseCase,
    private readonly deleteGameObjectUseCase: DeleteGameObjectUseCase,
    private readonly createBlockUseCase: CreateBlockUseCase,
    private readonly updateBlockUseCase: UpdateBlockUseCase,
    
    // 2. Используем @Inject с токенами для интерфейсов
    @Inject(PAGE_REPOSITORY) private readonly pageRepo: PageRepository,
    @Inject(BLOCK_REPOSITORY) private readonly blockRepo: BlockRepository,
  ) {}

  @Post('game-objects')
  createGameObject(
    @Param('projectId', ParseUUIDPipe) projectId: string, 
    @Body() dto: CreateGameObjectDtoType
  ) {
    return this.createGameObjectUseCase.execute(projectId, dto.name, dto.parentId ?? null);
  }

  @Get('game-objects/:goId/pages')
  async getPages(@Param('goId', ParseUUIDPipe) goId: string) {
    return this.pageRepo.findByGameObjectId(goId);
  }

  @Post('pages/:pageId/blocks')
  createBlock(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Body() dto: CreateBlockDtoType
  ) {
    return this.createBlockUseCase.execute(projectId, pageId, dto.type as BlockType, dto.data);
  }

  @Post('blocks/:blockId/update')
  updateBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string, 
    @Body() dto: UpdateBlockDtoType
  ) {
    return this.updateBlockUseCase.execute(blockId, dto.data);
  }

  @Post('game-objects/:goId/delete')
  async deleteGameObject(@Param('goId', ParseUUIDPipe) goId: string) {
    await this.deleteGameObjectUseCase.execute(goId);
    return { success: true };
  }
}