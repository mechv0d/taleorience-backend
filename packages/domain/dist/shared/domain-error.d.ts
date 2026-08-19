export declare class DomainError extends Error {
    readonly code: string;
    readonly messageKey: string;
    readonly params?: Record<string, unknown> | undefined;
    readonly status: number;
    constructor(code: string, messageKey: string, params?: Record<string, unknown> | undefined, status?: number);
}
//# sourceMappingURL=domain-error.d.ts.map