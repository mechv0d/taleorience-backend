import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  it('applies secure defaults', () => {
    const env = validateEnv({});

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(4000);
    expect(env.APP_MODE).toBe('local');
    expect(env.AUTH_MODE).toBe('none');
    expect(env.STORAGE_DRIVER).toBe('local');
    expect(env.DEFAULT_LOCALE).toBe('en');
    expect(env.FALLBACK_LOCALE).toBe('en');
  });

  it('rejects invalid APP_MODE', () => {
    expect(() =>
      validateEnv({
        APP_MODE: 'invalid-mode',
      }),
    ).toThrow();
  });

  it('rejects invalid STORAGE_DRIVER', () => {
    expect(() =>
      validateEnv({
        STORAGE_DRIVER: 'ftp',
      }),
    ).toThrow();
  });
});
