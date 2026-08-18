import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(4000),

  APP_MODE: z.enum(['local', 'self_hosted', 'saas']).default('local'),

  AUTH_MODE: z.enum(['none', 'local', 'saas']).default('none'),

  DATABASE_URL: z.string().min(1).default('sqlite://./data/taleorience.db'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),

  STORAGE_ROOT: z.string().min(1).default('./storage'),

  LOCALES_ROOT: z.string().min(1).default('../../locales'),

  DEFAULT_LOCALE: z.string().min(2).default('en'),

  FALLBACK_LOCALE: z.string().min(2).default('en'),

  APP_VERSION: z.string().default('0.0.0'),

  GIT_COMMIT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
}
