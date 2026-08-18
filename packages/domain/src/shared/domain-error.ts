export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly messageKey: string,
    public readonly params?: Record<string, unknown>,
    public readonly status: number = 400,
  ) {
    super(code);
    this.name = 'DomainError';
  }
}
