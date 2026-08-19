import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { S3FileStorage } from './s3-file.storage';
import { UploadedFile } from '@taleorience/application';

const sendMock = vi.fn();

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(function () {
      return { send: sendMock };
    }),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
  };
});

const file: UploadedFile = {
  buffer: Buffer.from('hello'),
  originalName: 'test.png',
  mimeType: 'image/png',
  size: 5,
};

describe('S3FileStorage', () => {
  let storage: S3FileStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new S3FileStorage({
      bucket: 'test-bucket',
      region: 'us-east-1',
    });
  });

  it('requires a bucket', () => {
    expect(() => new S3FileStorage({ bucket: '' })).toThrow(
      'S3 bucket is required',
    );
  });

  it('saves a file with PutObject', async () => {
    sendMock.mockResolvedValue({});

    const result = await storage.save(file, 'projects/p1/assets/a.png');

    expect(result).toBe('projects/p1/assets/a.png');
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'projects/p1/assets/a.png',
      Body: file.buffer,
      ContentType: 'image/png',
      ContentLength: 5,
    });
  });

  it('gets a file body as buffer', async () => {
    sendMock.mockResolvedValue({
      Body: { transformToByteArray: () => Promise.resolve([104, 105]) },
    });

    const buffer = await storage.get('projects/p1/assets/a.png');

    expect(buffer).toEqual(Buffer.from('hi'));
    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'projects/p1/assets/a.png',
    });
  });

  it('throws FILE_NOT_FOUND when body is missing', async () => {
    sendMock.mockResolvedValue({ Body: undefined });

    await expect(storage.get('missing.png')).rejects.toMatchObject({
      code: 'FILE_NOT_FOUND',
      status: 404,
    });
  });

  it('throws STORAGE_ERROR on AWS failure', async () => {
    sendMock.mockRejectedValue(new Error('network'));

    await expect(storage.get('a.png')).rejects.toMatchObject({
      code: 'STORAGE_ERROR',
      status: 500,
    });
  });

  it('deletes a file', async () => {
    sendMock.mockResolvedValue({});

    await storage.delete('projects/p1/assets/a.png');

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'projects/p1/assets/a.png',
    });
  });

  it('exists returns true on HeadObject success', async () => {
    sendMock.mockResolvedValue({});

    expect(await storage.exists('a.png')).toBe(true);
    expect(HeadObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'a.png',
    });
  });

  it('exists returns false on HeadObject failure', async () => {
    sendMock.mockRejectedValue(new Error('not found'));

    expect(await storage.exists('a.png')).toBe(false);
  });
});