import { BlockType, DomainError } from '@taleorience/domain';

export type BlockDataValidation = {
  errors: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

function isGuid(value: unknown): value is string {
  return isString(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isHttpUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isGuidArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isGuid);
}

const validators: Record<BlockType, (data: Record<string, unknown>) => BlockDataValidation> = {
  [BlockType.TEXT]: (data) => {
    const errors: Record<string, string> = {};
    if (!isNonEmptyString(data.content)) errors.content = 'errors.invalidBlockData';
    return { errors };
  },
  [BlockType.IMAGE]: (data) => ({
    errors: {
      ...(isGuid(data.assetId) ? {} : { assetId: 'errors.invalidBlockData' }),
      ...(data.caption === undefined || isString(data.caption) ? {} : { caption: 'errors.invalidBlockData' }),
    },
  }),
  [BlockType.GALLERY]: (data) => {
    const errors: Record<string, string> = {};
    if (!isGuidArray(data.assetIds)) errors.assetIds = 'errors.invalidBlockData';
    return { errors };
  },
  [BlockType.QUOTE]: (data) => ({
    errors: {
      ...(isNonEmptyString(data.content) ? {} : { content: 'errors.invalidBlockData' }),
      ...(data.attribution === undefined || isString(data.attribution) ? {} : { attribution: 'errors.invalidBlockData' }),
    },
  }),
  [BlockType.CALLOUT]: (data) => ({
    errors: {
      ...(isNonEmptyString(data.content) ? {} : { content: 'errors.invalidBlockData' }),
      ...(data.emoji === undefined || isString(data.emoji) ? {} : { emoji: 'errors.invalidBlockData' }),
    },
  }),
  [BlockType.DIVIDER]: () => ({ errors: {} }),
  [BlockType.TABLE]: (data) => {
    const errors: Record<string, string> = {};
    if (data.headers !== undefined && !isStringArray(data.headers)) {
      errors.headers = 'errors.invalidBlockData';
    }
    if (data.rows !== undefined) {
      if (!Array.isArray(data.rows) || !data.rows.every((row) => isStringArray(row))) {
        errors.rows = 'errors.invalidBlockData';
      }
    }
    return { errors };
  },
  [BlockType.EMBED]: (data) => ({
    errors: {
      ...(isHttpUrl(data.url) ? {} : { url: 'errors.invalidBlockData' }),
      ...(data.caption === undefined || isString(data.caption) ? {} : { caption: 'errors.invalidBlockData' }),
    },
  }),
};

export function validateBlockData(type: BlockType, data: Record<string, unknown>): void {
  const validator = validators[type];
  if (!validator) {
    throw new DomainError('INVALID_BLOCK_TYPE', 'errors.invalidBlockType', { type });
  }
  if (!isRecord(data)) {
    throw new DomainError('INVALID_BLOCK_DATA', 'errors.invalidBlockData', { type });
  }
  const { errors } = validator(data);
  const keys = Object.keys(errors);
  if (keys.length > 0) {
    throw new DomainError('INVALID_BLOCK_DATA', 'errors.invalidBlockData', { type, fields: keys.join(', ') });
  }
}

export function normalizeBlockData(type: BlockType, data: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case BlockType.TABLE:
      return { headers: isStringArray(data.headers) ? data.headers : undefined, rows: data.rows ?? [] };
    default:
      return data;
  }
}

export function blockToText(block: { type: BlockType; data: Record<string, unknown> }): string {
  switch (block.type) {
    case BlockType.TEXT:
      return isString(block.data.content) ? block.data.content : '';
    case BlockType.QUOTE:
      return [block.data.content, block.data.attribution].filter(isString).join(' ');
    case BlockType.CALLOUT:
      return [block.data.emoji, block.data.content].filter(isString).join(' ');
    case BlockType.IMAGE:
      return isString(block.data.caption) ? block.data.caption : '';
    case BlockType.GALLERY:
      return '';
    case BlockType.TABLE: {
      const rows: string[][] = Array.isArray(block.data.rows) && block.data.rows.every(isStringArray) ? block.data.rows : [];
      const headers: string[] = isStringArray(block.data.headers) ? block.data.headers : [];
      return [...headers, ...rows.flat()].join(' ');
    }
    case BlockType.EMBED:
      return [block.data.url, block.data.caption].filter(isString).join(' ');
    case BlockType.DIVIDER:
      return '';
  }
}