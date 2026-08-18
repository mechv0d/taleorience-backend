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

// --- Compile-time Types (для TypeScript) ---
export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;
export type CreateGameObjectDtoType = z.infer<typeof CreateGameObjectDto>;
export type CreateBlockDtoType = z.infer<typeof CreateBlockDto>;
export type UpdateBlockDtoType = z.infer<typeof UpdateBlockDto>;