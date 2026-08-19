import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import type {
  CreateGameObjectDtoType,
  CreateBlockDtoType,
  UpdateBlockDtoType,
  MoveBlockDtoType,
  DuplicateBlockDtoType,
} from '@taleorience/contracts';
import { BlockType } from '@taleorience/domain';
import {
  CreateGameObjectUseCase,
  CreateBlockUseCase,
  UpdateBlockUseCase,
  DeleteGameObjectUseCase,
  ListPageBlocksUseCase,
  GetBlockUseCase,
  DeleteBlockUseCase,
  MoveBlockUseCase,
  DuplicateBlockUseCase,
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
    private readonly listPageBlocksUseCase: ListPageBlocksUseCase,
    private readonly getBlockUseCase: GetBlockUseCase,
    private readonly deleteBlockUseCase: DeleteBlockUseCase,
    private readonly moveBlockUseCase: MoveBlockUseCase,
    private readonly duplicateBlockUseCase: DuplicateBlockUseCase,

    // 2. Используем @Inject с токенами для интерфейсов
    @Inject(PAGE_REPOSITORY) private readonly pageRepo: PageRepository,
    @Inject(BLOCK_REPOSITORY) private readonly blockRepo: BlockRepository,
  ) {}

  @Post('game-objects')
  createGameObject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateGameObjectDtoType,
  ) {
    return this.createGameObjectUseCase.execute(
      projectId,
      dto.name,
      dto.parentId ?? null,
    );
  }

  @Get('game-objects/:goId/pages')
  async getPages(@Param('goId', ParseUUIDPipe) goId: string) {
    return this.pageRepo.findByGameObjectId(goId);
  }

  @Post('pages/:pageId/blocks')
  createBlock(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Body() dto: CreateBlockDtoType,
  ) {
    return this.createBlockUseCase.execute(
      projectId,
      pageId,
      dto.type as BlockType,
      dto.data,
    );
  }

  @Post('blocks/:blockId/update')
  updateBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: UpdateBlockDtoType,
  ) {
    return this.updateBlockUseCase.execute(blockId, dto.data);
  }

  @Get('pages/:pageId/blocks')
  listBlocks(@Param('pageId', ParseUUIDPipe) pageId: string) {
    return this.listPageBlocksUseCase.execute(pageId);
  }

  @Get('blocks/:blockId')
  getBlock(@Param('blockId', ParseUUIDPipe) blockId: string) {
    return this.getBlockUseCase.execute(blockId);
  }

  @Delete('blocks/:blockId')
  async deleteBlock(@Param('blockId', ParseUUIDPipe) blockId: string) {
    await this.deleteBlockUseCase.execute(blockId);
    return { success: true };
  }

  @Post('blocks/:blockId/move')
  moveBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: MoveBlockDtoType,
  ) {
    return this.moveBlockUseCase.execute(blockId, dto.toIndex);
  }

  @Post('blocks/:blockId/duplicate')
  duplicateBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: DuplicateBlockDtoType,
  ) {
    return this.duplicateBlockUseCase.execute(blockId, dto.toIndex);
  }

  @Post('game-objects/:goId/delete')
  async deleteGameObject(@Param('goId', ParseUUIDPipe) goId: string) {
    await this.deleteGameObjectUseCase.execute(goId);
    return { success: true };
  }
}
