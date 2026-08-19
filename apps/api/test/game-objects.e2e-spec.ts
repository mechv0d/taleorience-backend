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
  projectId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
}
interface TreeNode extends GameObjectResponse {
  children: TreeNode[];
}

describe('Game Objects (list + tree e2e)', () => {
  let app: NestFastifyApplication;
  let projectId: string;
  let rootId: string;
  let childId: string;

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
      payload: { name: 'Tree World' },
    });
    expect(res.statusCode).toBe(201);
    projectId = (JSON.parse(res.payload) as ProjectResponse).id;
  });

  it('2. Create root and child GameObjects', async () => {
    const root = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects`,
      payload: { name: 'Kingdom' },
    });
    expect(root.statusCode).toBe(201);
    rootId = (JSON.parse(root.payload) as GameObjectResponse).id;

    const child = await app.inject({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/game-objects`,
      payload: { name: 'Capital', parentId: rootId },
    });
    expect(child.statusCode).toBe(201);
    childId = (JSON.parse(child.payload) as GameObjectResponse).id;
    expect((JSON.parse(child.payload) as GameObjectResponse).parentId).toBe(
      rootId,
    );
  });

  it('3. GET list returns flat sorted list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects`,
    });
    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.payload) as GameObjectResponse[];
    expect(list.length).toBe(2);
    expect(list.every((go) => go.projectId === projectId)).toBe(true);
    expect(list.map((go) => go.name)).toEqual(['Kingdom', 'Capital']);
  });

  it('4. GET tree returns hierarchy', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/game-objects/tree`,
    });
    expect(res.statusCode).toBe(200);
    const tree = JSON.parse(res.payload) as TreeNode[];
    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe('Kingdom');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].name).toBe('Capital');
    expect(tree[0].children[0].id).toBe(childId);
  });

  it('5. Empty project returns empty list and tree', async () => {
    const emptyProject = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      payload: { name: 'Empty' },
    });
    const emptyId = (JSON.parse(emptyProject.payload) as ProjectResponse).id;

    const list = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${emptyId}/game-objects`,
    });
    expect(JSON.parse(list.payload)).toEqual([]);

    const tree = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${emptyId}/game-objects/tree`,
    });
    expect(JSON.parse(tree.payload)).toEqual([]);
  });
});
