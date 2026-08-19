import { Guid } from '../shared/guid';

export enum AssetType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  OTHER = 'other',
}

export interface Asset {
  id: Guid;
  projectId: Guid;
  folderId: Guid | null;
  type: AssetType;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
