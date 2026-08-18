import { resolve } from 'node:path';

// ВАЖНО: Переменные окружения должны быть установлены ДО любых импортов NestJS
process.env.NODE_ENV = 'test';
process.env.APP_MODE = 'local';
process.env.AUTH_MODE = 'none';
process.env.DATABASE_URL = 'sqlite://./data/test.db';
process.env.STORAGE_DRIVER = 'local';
process.env.STORAGE_ROOT = './storage-test';
process.env.DEFAULT_LOCALE = 'en';
process.env.FALLBACK_LOCALE = 'en';
process.env.APP_VERSION = '0.0.0-test';
process.env.GIT_COMMIT = 'test-commit';
process.env.LOCALES_ROOT = resolve(__dirname, '../../../locales');

// Сбрасываем кэш модулей, чтобы ConfigModule перечитал env vars
jest.resetModules();

import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

// Типы для ответов API
interface HealthResponse {
  status: string;
  timestamp: string;
}

interface VersionResponse {
  version: string;
  gitCommit: string | null;
}

interface SystemInfoResponse {
  appMode: string;
  authMode: string;
  databaseProvider: string;
  storageDriver: string;
  defaultLocale: string;
  fallbackLocale: string;
}

interface ClientConfigResponse {
  appMode: string;
  authMode: string;
  defaultLocale: string;
  fallbackLocale: string;
  maxAssetUploadBytes: number;
  features: {
    localization: boolean;
    projects: boolean;
    gameObjects: boolean;
    pages: boolean;
    blocks: boolean;
    assets: boolean;
    templates: boolean;
    search: boolean;
    realtime: boolean;
  };
}

interface LocaleManifestItem {
  code: string;
  namespaces: string[];
}

interface LocalesResponse {
  locales: LocaleManifestItem[];
}

interface ErrorsNamespaceResponse {
  notFound: string;
  projectNotFound: string;
  [key: string]: string;
}

interface ProblemJsonResponse {
  type: string;
  code: string;
  messageKey: string;
  params?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

async function createApp(): Promise<NestFastifyApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  app.setGlobalPrefix('api/v1');

  // ВАЖНО: init() должен быть вызван ПЕРЕД установкой кастомного notFoundHandler,
  // потому что NestJS внутри init() регистрирует свой дефолтный handler.
  // Мы переопределяем его ПОСЛЕ инициализации, но ДО ready().
  await app.init();

  await app.getHttpAdapter().getInstance().ready();

  return app;
}

describe('Phase 0 API (e2e)', () => {
  let app: NestFastifyApplication | undefined;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('system endpoints', () => {
    it('GET /api/v1/health returns ok', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.payload) as HealthResponse;

      expect(body.status).toBe('ok');
      expect(typeof body.timestamp).toBe('string');
    });

    it('GET /api/v1/version returns version', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/version',
      });

      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.payload) as VersionResponse;

      expect(body.version).toBe('0.0.0-test');
      expect(body.gitCommit).toBe('test-commit');
    });

    it('GET /api/v1/system/info returns runtime info', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/system/info',
      });

      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.payload) as SystemInfoResponse;

      expect(body.appMode).toBe('local');
      expect(body.authMode).toBe('none');
      expect(body.databaseProvider).toBe('sqlite');
      expect(body.storageDriver).toBe('local');
      expect(body.defaultLocale).toBe('en');
      expect(body.fallbackLocale).toBe('en');
    });

    it('GET /api/v1/client-config returns client configuration', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/client-config',
      });

      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.payload) as ClientConfigResponse;

      expect(body.appMode).toBe('local');
      expect(body.authMode).toBe('none');
      expect(body.defaultLocale).toBe('en');
      expect(body.features.localization).toBe(true);
      expect(body.features.projects).toBe(false);
    });
  });

  describe('localization endpoints', () => {
    it('GET /api/v1/system/locales returns manifest', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/system/locales',
      });

      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.payload) as LocalesResponse;

      expect(Array.isArray(body.locales)).toBe(true);

      const en = body.locales.find(
        (locale: LocaleManifestItem) => locale.code === 'en',
      );

      expect(en).toBeDefined();
      expect(en?.namespaces).toContain('errors');
    });

    it('GET /api/v1/system/locales/en/errors returns errors namespace', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/system/locales/en/errors',
      });

      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.payload) as ErrorsNamespaceResponse;

      expect(body.notFound).toBeDefined();
      expect(body.projectNotFound).toBeDefined();
    });

    it('returns problem+json for missing locale namespace', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/system/locales/xx/errors',
      });

      expect(result.statusCode).toBe(404);
      expect(result.headers['content-type']).toContain(
        'application/problem+json',
      );

      const body = JSON.parse(result.payload) as ProblemJsonResponse;

      expect(body.code).toBe('LOCALE_NOT_FOUND');
      expect(body.messageKey).toBe('errors.localeNotFound');
    });

    it('returns problem+json for invalid locale', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/system/locales/INVALID/errors',
      });

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.payload) as ProblemJsonResponse;

      expect(body.code).toBe('INVALID_LOCALE');
      expect(body.messageKey).toBe('errors.invalidLocale');
    });
  });

  describe('unknown routes', () => {
    it('returns problem+json for unknown route', async () => {
      if (!app) throw new Error('App not initialized');

      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/unknown-route',
      });

      expect(result.statusCode).toBe(404);
      expect(result.headers['content-type']).toContain(
        'application/problem+json',
      );

      const body = JSON.parse(result.payload) as ProblemJsonResponse;

      expect(body.code).toBe('NOT_FOUND');
      expect(body.messageKey).toBe('errors.notFound');
    });
  });
});
