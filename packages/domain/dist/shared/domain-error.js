"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainError = void 0;
class DomainError extends Error {
    code;
    messageKey;
    params;
    status;
    constructor(code, messageKey, params, status = 400) {
        super(code);
        this.code = code;
        this.messageKey = messageKey;
        this.params = params;
        this.status = status;
        this.name = 'DomainError';
    }
}
exports.DomainError = DomainError;
//# sourceMappingURL=domain-error.js.map