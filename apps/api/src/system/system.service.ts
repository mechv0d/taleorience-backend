import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class SystemService {
  constructor(private readonly config: AppConfigService) {}

  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  version() {
    return {
      version: this.config.appVersion,
      gitCommit: this.config.gitCommit,
    };
  }

  info() {
    return {
      appMode: this.config.appMode,
      authMode: this.config.authMode,
      databaseProvider: this.config.databaseProvider,
      storageDriver: this.config.storageDriver,
      defaultLocale: this.config.defaultLocale,
      fallbackLocale: this.config.fallbackLocale,
    };
  }

  clientConfig() {
    return {
      appMode: this.config.appMode,
      authMode: this.config.authMode,
      defaultLocale: this.config.defaultLocale,
      fallbackLocale: this.config.fallbackLocale,
      maxAssetUploadBytes: 104_857_600,
      features: {
        localization: true,
        projects: false,
        gameObjects: false,
        pages: false,
        blocks: false,
        assets: false,
        templates: false,
        search: false,
        realtime: false,
      },
    };
  }
}
