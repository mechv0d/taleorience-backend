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
interface TagResponse {
  id: string;
  projectId: string;
  name: string;
}
interface RelationResponse {
  id: string;
  projectId: string;
  sourceGameObjectId: string;
  targetGameObjectId: string;
  type: string;
}
interface BacklinkResponse {
  referenceId: string;
  blockId: string;
  pageId: string;
  pageTitle: string;
  label: string | null;
}
interface ProblemJsonResponse {
  code: string;
}

describe('Phase 3 Tags, Relations, References (e2e)', () => {
  let app: NestFastifyApplication;
  let projectId: string;
  let citadelId: string;
  let capitalId: string;
  let pageId: string;
  let blockId: string;
  let tagId: string;
  let relationId: string;

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
      payload: { name: 'Kingdom World', description: 'Phase 3 test' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as ProjectResponse;
    projectId = body.id;
  });

  it('2. Create Two GameObjects', async () => {
    const res1 = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects`,
      payload: { name: 'Moonlight Citadel' },
    });
    expect(res1.statusCode).toBe(201);
    citadelId = (JSON.parse(res1.payload) as GameObjectResponse).id;

    const res2 = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects`,
      payload: { name: 'Capital' },
    });
    expect(res2.statusCode).toBe(201);
    capitalId = (JSON.parse(res2.payload) as GameObjectResponse).id;

    const pagesRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${citadelId}/pages`,
    });
    const pages = JSON.parse(pagesRes.payload) as PageResponse[];
    pageId = pages[0].id;
  });

  it('3. Create Tag', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/tags`,
      payload: { name: 'Landmark' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as TagResponse;
    expect(body.name).toBe('Landmark');
    tagId = body.id;
  });

  it('4. List Tags', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/tags`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as TagResponse[];
    expect(body.some((t) => t.id === tagId)).toBe(true);
  });

  it('5. Add Tag to GameObject', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects/${citadelId}/tags`,
      payload: { name: 'Landmark' },
    });
    expect(res.statusCode).toBe(201);

    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${citadelId}/tags`,
    });
    expect(listRes.statusCode).toBe(200);
    const tags = JSON.parse(listRes.payload) as TagResponse[];
    expect(tags.some((t) => t.name === 'Landmark')).toBe(true);
  });

  it('6. Remove Tag from GameObject', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/game-objects/${citadelId}/tags/${tagId}`,
    });
    expect(res.statusCode).toBe(200);

    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${citadelId}/tags`,
    });
    const tags = JSON.parse(listRes.payload) as TagResponse[];
    expect(tags.length).toBe(0);
  });

  it('7. Create Relation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects/${citadelId}/relations`,
      payload: { targetGameObjectId: capitalId, type: 'relations.locatedIn' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as RelationResponse;
    expect(body.sourceGameObjectId).toBe(citadelId);
    expect(body.targetGameObjectId).toBe(capitalId);
    expect(body.type).toBe('relations.locatedIn');
    relationId = body.id;
  });

  it('8. List Relations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/relations`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as RelationResponse[];
    expect(body.some((r) => r.id === relationId)).toBe(true);
  });

  it('9. Create Block With Markdown Reference', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/pages/${pageId}/blocks`,
      payload: {
        type: 'text',
        data: {
          content:
            'The [[Capital]] is nearby [[Moonlight Citadel|the citadel]].',
        },
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload) as BlockResponse;
    blockId = body.id;
  });

  it('10. Backlinks Return Referencing Page', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${capitalId}/backlinks`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as BacklinkResponse[];
    expect(body.length).toBeGreaterThan(0);
    const backlink = body[0];
    expect(backlink.blockId).toBe(blockId);
    expect(backlink.pageId).toBe(pageId);
  });

  it('11. Update Block Re-syncs References', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/blocks/${blockId}/update`,
      payload: { data: { content: 'No references here.' } },
    });
    expect(res.statusCode).toBe(201);

    const backlinksRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/${capitalId}/backlinks`,
    });
    const backlinks = JSON.parse(backlinksRes.payload) as BacklinkResponse[];
    expect(backlinks.length).toBe(0);
  });

  it('12. Resolve References by Query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/references/resolve?q=Cap`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as GameObjectResponse[];
    expect(body.some((g) => g.id === capitalId)).toBe(true);
  });

  it('13. Search Index is Updated After Block Update', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/search?q=references`,
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload) as Array<{ entityId: string }>;
    expect(body.some((entry) => entry.entityId === blockId)).toBe(true);
  });

  it('14. Delete Relation', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/relations/${relationId}`,
    });
    expect(res.statusCode).toBe(200);

    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/relations`,
    });
    const body = JSON.parse(listRes.payload) as RelationResponse[];
    expect(body.some((r) => r.id === relationId)).toBe(false);
  });

  it('15. Delete Tag', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}/tags/${tagId}`,
    });
    expect(res.statusCode).toBe(200);

    const listRes = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/tags`,
    });
    const body = JSON.parse(listRes.payload) as TagResponse[];
    expect(body.some((t) => t.id === tagId)).toBe(false);
  });

  it('16. Create Relation Fails for Missing GameObject', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects/${citadelId}/relations`,
      payload: {
        targetGameObjectId: '00000000-0000-4000-8000-000000000000',
        type: 'relations.relatedTo',
      },
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.payload) as ProblemJsonResponse;
    expect(body.code).toBe('GAME_OBJECT_NOT_FOUND');
  });
});
