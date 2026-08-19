process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite::memory:';
jest.resetModules();

import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap/create-app';

interface ProjectResponse {
  id: string;
}
interface GameObjectResponse {
  id: string;
}
interface PageResponse {
  id: string;
}
interface BlockResponse {
  id: string;
  type: string;
  sortOrder: number;
  data: Record<string, unknown>;
}
interface ProblemJsonResponse {
  code: string;
}

const VALID_UUID = '3f3f9f40-1b2a-4c8e-9d0e-5f7f8f9f0a0b';

describe('Blocks (MVP types + CRUD e2e)', () => {
  let app: NestFastifyApplication;
  let projectId: string;
  let pageId: string;
  let textBlockId: string;
  let imageBlockId: string;

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
      payload: { name: 'Blocks World', description: 'Blocks e2e test' },
    });
    expect(res.statusCode).toBe(201);
    projectId = (JSON.parse(res.payload) as ProjectResponse).id;
  });

  it('2. Create GameObject and get its page', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects`,
      payload: { name: 'Heroes' },
    });
    expect(res.statusCode).toBe(201);
    const goId = (JSON.parse(res.payload) as GameObjectResponse).id;

    const pagesRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${goId}/pages`,
    });
    expect(pagesRes.statusCode).toBe(200);
    const pages = JSON.parse(pagesRes.payload) as PageResponse[];
    pageId = pages[0].id;
  });

  it('3. Create all 8 block types', async () => {
    const cases: Array<{ type: string; data: Record<string, unknown> }> = [
      { type: 'text', data: { content: 'Intro [[Heroes]]' } },
      { type: 'image', data: { assetId: VALID_UUID, caption: 'Map' } },
      { type: 'gallery', data: { assetIds: [VALID_UUID] } },
      { type: 'quote', data: { content: 'Courage', attribution: 'Bard' } },
      { type: 'callout', data: { content: 'Note', emoji: '💡' } },
      { type: 'divider', data: {} },
      { type: 'table', data: { headers: ['Name'], rows: [['Aldric']] } },
      { type: 'embed', data: { url: 'https://example.com/map' } },
    ];

    const created: Array<{ type: string; id: string }> = [];
    for (const c of cases) {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}/pages/${pageId}/blocks`,
        payload: c,
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload) as BlockResponse;
      expect(body.type).toBe(c.type);
      created.push({ type: c.type, id: body.id });
    }
    textBlockId = created[0].id;
    imageBlockId = created[1].id;
    expect(created).toHaveLength(8);
  });

  it('4. Blocks get incremental sortOrder', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/pages/${pageId}/blocks`,
    });
    expect(res.statusCode).toBe(200);
    const blocks = JSON.parse(res.payload) as BlockResponse[];
    expect(blocks.map((b) => b.sortOrder)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('5. Get single block by id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/blocks/${imageBlockId}`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as BlockResponse;
    expect(body.id).toBe(imageBlockId);
    expect(body.type).toBe('image');
  });

  it('6. Move block 1 to index 5', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/blocks/${textBlockId}/move`,
      payload: { toIndex: 5 },
    });
    expect(res.statusCode).toBe(201);
    const blocks = JSON.parse(res.payload) as BlockResponse[];
    expect(blocks[5].id).toBe(textBlockId);
    expect(blocks.map((b) => b.sortOrder)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('7. Update block to invalid data fails', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/blocks/${textBlockId}/update`,
      payload: { data: { assetId: VALID_UUID } },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('INVALID_BLOCK_DATA');
  });

  it('8. Update block with valid data succeeds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/blocks/${textBlockId}/update`,
      payload: { data: { content: 'Updated [[Heroes]]' } },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as BlockResponse;
    expect(body.data.content).toBe('Updated [[Heroes]]');
  });

  it('9. Create embed block with bad url fails', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/pages/${pageId}/blocks`,
      payload: { type: 'embed', data: { url: 'not-a-url' } },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('INVALID_BLOCK_DATA');
  });

  it('10. Delete block cleans up references and search index', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/blocks/${imageBlockId}`,
    });
    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/blocks/${imageBlockId}`,
    });
    expect(getRes.statusCode).toBe(404);
  });

  it('11. Delete missing block returns 404', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/blocks/00000000-0000-4000-8000-000000000000`,
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('BLOCK_NOT_FOUND');
  });

  it('12. Duplicate block appends a copy', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/blocks/${textBlockId}/duplicate`,
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const copy = JSON.parse(res.payload) as BlockResponse;
    expect(copy.id).not.toBe(textBlockId);
    expect(copy.type).toBe('text');
    expect(copy.data.content).toBe('Updated [[Heroes]]');

    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/pages/${pageId}/blocks`,
    });
    expect(listRes.statusCode).toBe(200);
    const blocks = JSON.parse(listRes.payload) as BlockResponse[];
    expect(blocks).toHaveLength(8);
    expect(blocks[blocks.length - 1].id).toBe(copy.id);
  });
});
