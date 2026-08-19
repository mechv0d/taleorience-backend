import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return Number(this.configService.get('PORT') ?? 4000);
  }

  get appMode(): string {
    return this.configService.get('APP_MODE') ?? 'local';
  }

  get authMode(): string {
    return this.configService.get('AUTH_MODE') ?? 'none';
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL') ?? '';
  }

  get databaseProvider(): 'sqlite' | 'postgres' | 'unknown' {
    const url = this.databaseUrl;

    if (url.startsWith('sqlite:')) {
      return 'sqlite';
    }

    if (url.startsWith('postgres:') || url.startsWith('postgresql:')) {
      return 'postgres';
    }

    return 'unknown';
  }

  get sqliteDatabasePath(): string {
    const url = this.databaseUrl;

    if (url.startsWith('sqlite:')) {
      const target = url.slice('sqlite:'.length).replace(/^\/+/, '');
      return target || './data/taleorience.db';
    }

    return './data/taleorience.db';
  }

  get storageDriver(): string {
    return this.configService.get('STORAGE_DRIVER') ?? 'local';
  }

  get storageRoot(): string {
    return this.resolvePath(
      this.configService.get('STORAGE_ROOT') ?? './storage',
    );
  }

  get localesRoot(): string {
    return this.resolvePath(
      this.configService.get('LOCALES_ROOT') ?? '../../locales',
    );
  }

  get defaultLocale(): string {
    return this.configService.get('DEFAULT_LOCALE') ?? 'en';
  }

  get fallbackLocale(): string {
    return this.configService.get('FALLBACK_LOCALE') ?? 'en';
  }

  get appVersion(): string {
    return this.configService.get('APP_VERSION') ?? '0.0.0';
  }

  get gitCommit(): string | null {
    return this.configService.get('GIT_COMMIT') ?? null;
  }

  private resolvePath(value: string): string {
    return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  }
}
