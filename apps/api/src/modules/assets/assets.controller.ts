import { Controller, Get, Post, Delete, Body } from '@nestjs/common';

@Controller('projects/:projectId/assets')
export class AssetsController {
  @Get()
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async listAssets(_projectId: string) {
    return [];
  }

  @Get(':assetId')
  // eslint-disable-next-line @typescript-eslint/require-await
  async getAsset() {
    return { id: 'test' };
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/require-await
  async uploadAsset() {
    return { path: 'test' };
  }

  @Delete(':assetId')
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async deleteAsset(_assetId: string) {
    return { deleted: true };
  }
}

@Controller('projects/:projectId/asset-folders')
export class AssetFoldersController {
  @Get()
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async listFolders(_projectId: string) {
    return [];
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async createFolder(_name: string, _parentId?: string) {
    return { name: 'test' };
  }

  @Delete(':folderId')
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async deleteFolder(_folderId: string) {
    return { deleted: true };
  }
}
