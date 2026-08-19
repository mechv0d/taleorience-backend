import { Guid } from '../shared/guid';

export interface Tag {
  id: Guid;
  projectId: Guid;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameObjectTag {
  gameObjectId: Guid;
  tagId: Guid;
  createdAt: Date;
}

export interface Relation {
  id: Guid;
  projectId: Guid;
  sourceGameObjectId: Guid;
  targetGameObjectId: Guid;
  type: string;
  createdAt: Date;
}

export interface Reference {
  id: Guid;
  projectId: Guid;
  sourceBlockId: Guid;
  targetGameObjectId: Guid;
  label: string | null;
  createdAt: Date;
}