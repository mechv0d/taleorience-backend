process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite::memory:';
jest.resetModules();

import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap/create-app';

interface ProjectResponse {
  id: string;
  name: string;
}
interface GameObjectResponse {
  id: string;
  projectId: string;
  name: string;
}
interface PageResponse {
  id: string;
  title: string;
}
interface BlockResponse {
  id: string;
  type: string;
  data: Record<string, unknown>;
}
interface ProblemJsonResponse {
  type: string;
  code: string;
  messageKey: string;
  params?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

describe('Phase 1 Core Domain (e2e)', () => {
  let app: NestFastifyApplication;
  let projectId: string;
  let gameObjectId: string;
  let pageId: string;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Create Project', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      payload: { name: 'Cool Fantasy', description: 'Test world' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as ProjectResponse;
    expect(body.name).toBe('Cool Fantasy');
    projectId = body.id;
  });

  it('2. Create GameObject (Auto-creates Main Page)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects`,
      payload: { name: 'Moonlight Citadel' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as GameObjectResponse;
    gameObjectId = body.id;

    // Проверяем, что страница Main создалась автоматически
    const pagesRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${gameObjectId}/pages`,
    });
    const pages = JSON.parse(pagesRes.payload) as PageResponse[];
    expect(pages.length).toBe(1);
    expect(pages[0].title).toBe('Main');
    pageId = pages[0].id;
  });

  it('3. Create TextBlock', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/pages/${pageId}/blocks`,
      payload: { type: 'text', data: { content: '# Hello World' } },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as BlockResponse;
    expect(body.type).toBe('text');
    expect(body.data.content).toBe('# Hello World');
  });

  it('4. Block Validation Fails on Invalid Data', async () => {
    if (!app) throw new Error('App not initialized');

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/pages/${pageId}/blocks`,
      payload: { type: 'text', data: { invalidField: 123 } },
    });

    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('INVALID_BLOCK_DATA');
  });

  it('5. Delete GameObject (Cascades Pages and Blocks)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects/${gameObjectId}/delete`,
    });
    expect(res.statusCode).toBe(201);

    // Проверяем, что страницы удалились
    const pagesRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${gameObjectId}/pages`,
    });
    const pages = JSON.parse(pagesRes.payload) as PageResponse[];
    expect(pages.length).toBe(0);
  });
});
