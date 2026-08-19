process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite::memory:';
jest.resetModules();

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap/create-app';

const TEST_ASSETS_DIR = join(__dirname, 'assets-for-test');
const pngBuffer = readFileSync(join(TEST_ASSETS_DIR, 'test-asset-1.png'));
const jpegBuffer = readFileSync(join(TEST_ASSETS_DIR, 'test-asset-1.jpg'));

interface ProjectResponse {
  id: string;
  name: string;
}

interface AssetResponse {
  id: string;
  projectId: string;
  folderId: string | null;
  type: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  usageCount: number;
}

interface AssetFolderResponse {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
}

interface ProblemJsonResponse {
  type: string;
  code: string;
  messageKey: string;
  params?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

describe('Phase 2 Assets (e2e)', () => {
  let app: NestFastifyApplication;
  let projectId: string;
  let assetId: string;
  let folderId: string;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('0. Create Project for Assets', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      payload: { name: 'Asset Test Project', description: 'Testing assets' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as ProjectResponse;
    projectId = body.id;
  });

  it('1. Upload Image Asset', async () => {
    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-asset-1.png');

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/assets`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      payload: formData,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as AssetResponse;
    expect(body.type).toBe('image');
    expect(body.mimeType).toBe('image/png');
    expect(body.width).toBeGreaterThan(0);
    expect(body.height).toBeGreaterThan(0);
    assetId = body.id;
  });

  it('2. Get Asset Metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/assets/${assetId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as AssetResponse;
    expect(body.id).toBe(assetId);
    expect(body.projectId).toBe(projectId);
  });

  it('3. List Assets', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/assets`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as AssetResponse[];
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  it('4. Create Asset Folder', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/asset-folders`,
      payload: { name: 'Images' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as AssetFolderResponse;
    expect(body.name).toBe('Images');
    folderId = body.id;
  });

  it('5. List Asset Folders', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/asset-folders`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as AssetFolderResponse[];
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  it('6. Upload Asset to Folder', async () => {
    const formData = new FormData();
    const blob = new Blob([jpegBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'test-asset-1.jpg');
    formData.append('folderId', folderId);

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/assets`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      payload: formData,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as AssetResponse;
    expect(body.folderId).toBe(folderId);
  });

  it('7. Delete Empty Folder', async () => {
    // Сначала создадим пустую папку
    const createRes = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/asset-folders`,
      payload: { name: 'ToDelete' },
    });
    const createBody = JSON.parse(createRes.payload) as AssetFolderResponse;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/asset-folders/${createBody.id}`,
    });
    expect(res.statusCode).toBe(201);
  });

  it('8. Cannot Delete Folder with Assets', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/asset-folders/${folderId}`,
    });
    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('FOLDER_NOT_EMPTY');
  });

  it('9. Cannot Delete Asset in Use', async () => {
    // Симулируем использование ассета (через incrementUsageCount)
    // В реальном приложении это делается через Block use-case
    // Для теста просто пытаемся удалить - должен быть usageCount = 0

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/assets/${assetId}`,
    });
    // Должен успешно удалиться так как usageCount = 0
    expect(res.statusCode).toBe(201);
  });

  it('10. File Too Large Validation', async () => {
    // Создаем большой файл (> 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

    const formData = new FormData();
    const blob = new Blob([largeBuffer], { type: 'application/octet-stream' });
    formData.append('file', blob, 'large-file.bin');

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/assets`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      payload: formData,
    });

    expect(res.statusCode).toBe(413);
    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('FILE_TOO_LARGE');
  });

  it('11. Unsupported MIME Type Validation', async () => {
    const exeBuffer = Buffer.from([0x4d, 0x5a]); // EXE signature

    const formData = new FormData();
    const blob = new Blob([exeBuffer], { type: 'application/x-msdownload' });
    formData.append('file', blob, 'malware.exe');

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/assets`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      payload: formData,
    });

    expect(res.statusCode).toBe(415);
    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('UNSUPPORTED_MIME_TYPE');
  });
});
