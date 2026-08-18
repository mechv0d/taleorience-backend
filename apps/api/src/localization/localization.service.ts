import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { DomainError } from '../common/errors/domain-error';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Dirent } from 'node:fs';

export interface LocalizationManifest {
  locales: Array<{
    code: string;
    namespaces: string[];
  }>;
}

@Injectable()
export class LocalizationService {
  private readonly cache = new Map<string, unknown>();

  private readonly localePattern = /^[a-z]{2}(-[A-Z]{2})?$/;
  private readonly namespacePattern = /^[a-z0-9-]+$/;

  constructor(private readonly config: AppConfigService) {}

  async getManifest(): Promise<LocalizationManifest> {
    const root = this.config.localesRoot;

    let entries: Dirent[];

    try {
      entries = await readdir(root, { withFileTypes: true });
    } catch {
      return {
        locales: [],
      };
    }

    const locales: LocalizationManifest['locales'] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const localeCode = entry.name;

      if (!this.isValidLocale(localeCode)) {
        continue;
      }

      const localeDir = path.join(root, localeCode);

      let files: string[];

      try {
        files = await readdir(localeDir);
      } catch {
        continue;
      }

      const namespaces = files
        .filter(
          (file): file is string =>
            typeof file === 'string' && file.endsWith('.json'),
        )
        .map((file) => file.replace(/\.json$/, ''))
        .filter((namespace) => this.isValidNamespace(namespace))
        .sort();

      locales.push({
        code: localeCode,
        namespaces,
      });
    }

    return {
      locales: locales.sort((a, b) => a.code.localeCompare(b.code)),
    };
  }

  async getNamespace(locale: string, namespace: string): Promise<unknown> {
    this.assertLocale(locale);
    this.assertNamespace(namespace);

    const cacheKey = `${locale}:${namespace}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const filePath = path.join(
      this.config.localesRoot,
      locale,
      `${namespace}.json`,
    );

    let raw: string;

    try {
      raw = await readFile(filePath, 'utf8');
    } catch {
      throw new DomainError(
        'LOCALE_NOT_FOUND',
        'errors.localeNotFound',
        {
          locale,
          namespace,
        },
        404,
      );
    }

    let json: unknown;

    try {
      json = JSON.parse(raw) as unknown;
    } catch {
      throw new DomainError(
        'LOCALE_FILE_INVALID',
        'errors.localeFileInvalid',
        {
          locale,
          namespace,
        },
        500,
      );
    }

    this.cache.set(cacheKey, json);
    return json;
  }

  private assertLocale(locale: string): void {
    if (!this.isValidLocale(locale)) {
      throw new DomainError(
        'INVALID_LOCALE',
        'errors.invalidLocale',
        {
          locale,
        },
        400,
      );
    }
  }

  private assertNamespace(namespace: string): void {
    if (!this.isValidNamespace(namespace)) {
      throw new DomainError(
        'INVALID_NAMESPACE',
        'errors.invalidNamespace',
        {
          namespace,
        },
        400,
      );
    }
  }

  private isValidLocale(locale: string): boolean {
    return this.localePattern.test(locale);
  }

  private isValidNamespace(namespace: string): boolean {
    return this.namespacePattern.test(namespace);
  }
}
