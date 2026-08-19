import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema-pg';
import { POSTGRES_SCHEMA_DDL } from './ddl';
import {
  PgProjectRepository,
  PgGameObjectRepository,
  PgPageRepository,
  PgBlockRepository,
  PgAssetRepository,
  PgAssetFolderRepository,
  PgUnitOfWork,
  PgDb,
} from './repositories-pg';

let db: PgDb;

beforeAll(async () => {
  const client = new PGlite();
  await client.exec(POSTGRES_SCHEMA_DDL);
  db = drizzle(client, { schema }) as unknown as PgDb;
});

describe('PgProjectRepository', () => {
  it('saves and finds a project', async () => {
    const repo = new PgProjectRepository(db);
    const now = new Date();
    await repo.save({
      id: 'proj-1',
      name: 'Test',
      description: 'desc',
      bannerAssetId: null,
      isExample: false,
      isReadOnly: false,
      createdAt: now,
      updatedAt: now,
    });

    const found = await repo.findById('proj-1');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Test');
  });

  it('updates an existing project on conflict', async () => {
    const repo = new PgProjectRepository(db);
    const now = new Date();
    await repo.save({
      id: 'proj-1',
      name: 'Renamed',
      description: 'updated',
      bannerAssetId: null,
      isExample: false,
      isReadOnly: false,
      createdAt: now,
      updatedAt: now,
    });

    const found = await repo.findById('proj-1');
    expect(found!.name).toBe('Renamed');
    expect(found!.description).toBe('updated');
  });

  it('deletes a project', async () => {
    const repo = new PgProjectRepository(db);
    await repo.delete('proj-1');
    expect(await repo.findById('proj-1')).toBeNull();
  });
});

describe('PgAssetRepository + PgUnitOfWork', () => {
  it('commits changes inside a transaction', async () => {
    const uow = new PgUnitOfWork(db);
    const now = new Date();

    await uow.execute(async (trx) => {
      const folderRepo = new PgAssetFolderRepository(trx as PgDb);
      await folderRepo.save({
        id: 'folder-1',
        projectId: 'proj-x',
        parentId: null,
        name: 'Images',
        createdAt: now,
        updatedAt: now,
      });

      const assetRepo = new PgAssetRepository(trx as PgDb);
      await assetRepo.save({
        id: 'asset-1',
        projectId: 'proj-x',
        folderId: 'folder-1',
        type: 'image',
        path: 'projects/proj-x/assets/1.png',
        mimeType: 'image/png',
        size: 10,
        width: 100,
        height: 100,
        metadata: { thumbnailPath: null },
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    });

    const folderRepo = new PgAssetFolderRepository(db);
    const folder = await folderRepo.findById('folder-1');
    expect(folder).not.toBeNull();
    expect(folder!.name).toBe('Images');

    const assetRepo = new PgAssetRepository(db);
    const asset = await assetRepo.findById('asset-1');
    expect(asset).not.toBeNull();
    expect(asset!.folderId).toBe('folder-1');
    expect(asset!.metadata.thumbnailPath).toBeNull();
  });

  it('rolls back when the callback throws', async () => {
    const uow = new PgUnitOfWork(db);
    const now = new Date();

    await expect(
      uow.execute(async (trx) => {
        const repo = new PgProjectRepository(trx as PgDb);
        await repo.save({
          id: 'rollback-proj',
          name: 'WillRollback',
          description: '',
          bannerAssetId: null,
          isExample: false,
          isReadOnly: false,
          createdAt: now,
          updatedAt: now,
        });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const repo = new PgProjectRepository(db);
    expect(await repo.findById('rollback-proj')).toBeNull();
  });
});

describe('PgGameObject/Page/Block repositories', () => {
  it('saves and queries a hierarchy', async () => {
    const now = new Date();

    const goRepo = new PgGameObjectRepository(db);
    await goRepo.save({
      id: 'go-1',
      projectId: 'proj-x',
      parentId: null,
      name: 'Hero',
      icon: null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });

    const pageRepo = new PgPageRepository(db);
    await pageRepo.save({
      id: 'page-1',
      projectId: 'proj-x',
      gameObjectId: 'go-1',
      title: 'Intro',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });

    const blockRepo = new PgBlockRepository(db);
    await blockRepo.save({
      id: 'block-1',
      projectId: 'proj-x',
      pageId: 'page-1',
      type: 'text',
      data: { text: 'hello' },
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });

    expect((await goRepo.findByProjectId('proj-x')).length).toBe(1);
    expect((await pageRepo.findByGameObjectId('go-1')).length).toBe(1);
    const block = await blockRepo.findById('block-1');
    expect(block!.data).toEqual({ text: 'hello' });
  });
});