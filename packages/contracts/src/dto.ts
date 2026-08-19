import { z } from 'zod';

// --- Runtime Schemas (для валидации) ---
export const CreateProjectDto = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
});

export const CreateGameObjectDto = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
});

export const CreateBlockDto = z.object({
  type: z.enum(['text', 'image', 'gallery', 'quote', 'callout', 'divider', 'table', 'embed']),
  data: z.record(z.string(), z.unknown()),
});

export const UpdateBlockDto = z.object({
  data: z.record(z.string(), z.unknown()),
});

export const MoveBlockDto = z.object({
  toIndex: z.coerce.number().int().min(0),
});

export const DuplicateBlockDto = z.object({
  toIndex: z.coerce.number().int().min(0).optional(),
});

export const CreateAssetFolderDto = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
});

export const UpdateAssetDto = z.object({
  folderId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CreateTagDto = z.object({
  name: z.string().min(1),
});

export const AddTagToGameObjectDto = z.object({
  name: z.string().min(1),
});

export const CreateRelationDto = z.object({
  targetGameObjectId: z.string().uuid(),
  type: z.string().min(1),
});

export const ResolveReferencesQueryDto = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const SearchQueryDto = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// --- Compile-time Types (для TypeScript) ---
export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;
export type CreateGameObjectDtoType = z.infer<typeof CreateGameObjectDto>;
export type CreateBlockDtoType = z.infer<typeof CreateBlockDto>;
export type UpdateBlockDtoType = z.infer<typeof UpdateBlockDto>;
export type MoveBlockDtoType = z.infer<typeof MoveBlockDto>;
export type DuplicateBlockDtoType = z.infer<typeof DuplicateBlockDto>;
export type CreateAssetFolderDtoType = z.infer<typeof CreateAssetFolderDto>;
export type UpdateAssetDtoType = z.infer<typeof UpdateAssetDto>;
export type CreateTagDtoType = z.infer<typeof CreateTagDto>;
export type AddTagToGameObjectDtoType = z.infer<typeof AddTagToGameObjectDto>;
export type CreateRelationDtoType = z.infer<typeof CreateRelationDto>;
export type ResolveReferencesQueryDtoType = z.infer<typeof ResolveReferencesQueryDto>;
export type SearchQueryDtoType = z.infer<typeof SearchQueryDto>;