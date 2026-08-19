import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { FileStorage, UploadedFile } from '@taleorience/application';
import { DomainError } from '@taleorience/domain';

export class LocalFileStorage implements FileStorage {
  constructor(private readonly root: string) {}

  private resolve(relativePath: string): string {
    const normalized = relativePath.replace(/\\/g, '/');
    const resolved = path.resolve(this.root, normalized);
    const rootResolved = path.resolve(this.root);

    if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
      throw new DomainError('PATH_TRAVERSAL_ATTEMPT', 'errors.pathTraversalAttempt', { path: relativePath }, 403);
    }

    return resolved;
  }

  async save(file: UploadedFile, relativePath: string): Promise<string> {
    const target = this.resolve(relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.buffer);
    return relativePath;
  }

  async get(relativePath: string): Promise<Buffer> {
    const target = this.resolve(relativePath);
    return fs.readFile(target);
  }

  async delete(relativePath: string): Promise<void> {
    const target = this.resolve(relativePath);
    await fs.unlink(target);
  }

  async exists(relativePath: string): Promise<boolean> {
    const target = this.resolve(relativePath);
    try {
      await fs.access(target);
      return true;
    } catch {
      return false;
    }
  }
}