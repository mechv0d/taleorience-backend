import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '@taleorience/domain';
import type {
  CreateAssetFolderDtoType,
  UpdateAssetDtoType,
} from '@taleorience/contracts';
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
} from '@taleorience/application';

@Controller('projects/:projectId/assets')
export class AssetsController {
  constructor(
    private readonly uploadAssetUseCase: UploadAssetUseCase,
    private readonly getAssetUseCase: GetAssetUseCase,
    private readonly listAssetsUseCase: ListAssetsUseCase,
    private readonly updateAssetUseCase: UpdateAssetUseCase,
    private readonly deleteAssetUseCase: DeleteAssetUseCase,
    private readonly getAssetContentUseCase: GetAssetContentUseCase,
    private readonly getAssetThumbnailUseCase: GetAssetThumbnailUseCase,
  ) {}

  @Get()
  listAssets(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.listAssetsUseCase.execute(projectId);
  }

  @Post()
  @HttpCode(201)
  async uploadAsset(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Req() request: FastifyRequest,
  ) {
    let buffer: Buffer | null = null;
    let originalName = '';
    let mimeType = '';
    let folderId: string | null = null;

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        buffer = await part.toBuffer();
        originalName = part.filename;
        mimeType = part.mimetype;
      } else if (part.type === 'field' && part.fieldname === 'folderId') {
        folderId = String(part.value);
      }
    }

    if (!buffer) {
      throw new DomainError('FILE_REQUIRED', 'errors.fileRequired', {}, 400);
    }

    return this.uploadAssetUseCase.execute(
      projectId,
      {
        buffer,
        originalName,
        mimeType,
        size: buffer.length,
      },
      folderId,
    );
  }

  @Get(':assetId')
  getAsset(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    return this.getAssetUseCase.execute(projectId, assetId);
  }

  @Patch(':assetId')
  updateAsset(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: UpdateAssetDtoType,
  ) {
    return this.updateAssetUseCase.execute(projectId, assetId, {
      folderId: dto.folderId ?? null,
      metadata: dto.metadata,
    });
  }

  @Get(':assetId/content')
  async getContent(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Res() reply: FastifyReply,
  ) {
    const { buffer, mimeType, size } =
      await this.getAssetContentUseCase.execute(projectId, assetId);
    return reply
      .header('content-type', mimeType)
      .header('content-length', size)
      .send(buffer);
  }

  @Get(':assetId/thumbnail')
  async getThumbnail(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Res() reply: FastifyReply,
  ) {
    const { buffer, mimeType } = await this.getAssetThumbnailUseCase.execute(
      projectId,
      assetId,
    );
    return reply
      .header('content-type', mimeType)
      .header('content-length', buffer.length)
      .send(buffer);
  }

  @Delete(':assetId')
  @HttpCode(201)
  async deleteAsset(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ) {
    await this.deleteAssetUseCase.execute(projectId, assetId);
    return { success: true };
  }
}

@Controller('projects/:projectId/asset-folders')
export class AssetFoldersController {
  constructor(
    private readonly createAssetFolderUseCase: CreateAssetFolderUseCase,
    private readonly listAssetFoldersUseCase: ListAssetFoldersUseCase,
    private readonly deleteAssetFolderUseCase: DeleteAssetFolderUseCase,
  ) {}

  @Get()
  listFolders(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.listAssetFoldersUseCase.execute(projectId);
  }

  @Post()
  @HttpCode(201)
  createFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateAssetFolderDtoType,
  ) {
    return this.createAssetFolderUseCase.execute(
      projectId,
      dto.name,
      dto.parentId ?? null,
    );
  }

  @Delete(':folderId')
  @HttpCode(201)
  async deleteFolder(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('folderId', ParseUUIDPipe) folderId: string,
  ) {
    await this.deleteAssetFolderUseCase.execute(projectId, folderId);
    return { success: true };
  }
}
