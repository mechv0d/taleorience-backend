import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { FileStorage, UploadedFile } from '@taleorience/application';
import { DomainError } from '@taleorience/domain';

export interface S3FileStorageOptions {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}

export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3FileStorageOptions) {
    if (!options.bucket) {
      throw new Error('S3 bucket is required when STORAGE_DRIVER=s3');
    }

    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            }
          : undefined,
    });
  }

  async save(file: UploadedFile, path: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: file.buffer,
        ContentType: file.mimeType,
        ContentLength: file.size,
      }),
    );

    return path;
  }

  async get(path: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );

      if (!response.Body) {
        throw new DomainError(
          'FILE_NOT_FOUND',
          'errors.fileNotFound',
          { path },
          404,
        );
      }

      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError(
        'STORAGE_ERROR',
        'errors.storageError',
        { path },
        500,
      );
    }
  }

  async delete(path: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}