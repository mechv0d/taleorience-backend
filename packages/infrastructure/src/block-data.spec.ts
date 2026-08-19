import { describe, expect, it } from 'vitest';
import { validateBlockData, normalizeBlockData, blockToText } from '@taleorience/application';
import { BlockType, DomainError } from '@taleorience/domain';

const VALID_UUID = '3f3f9f40-1b2a-4c8e-9d0e-5f7f8f9f0a0b';

describe('validateBlockData', () => {
  it('accepts valid text block', () => {
    expect(() => validateBlockData(BlockType.TEXT, { content: 'Hello [[World]]' })).not.toThrow();
  });

  it('rejects text block without content', () => {
    expect(() => validateBlockData(BlockType.TEXT, {})).toThrow(DomainError);
  });

  it('accepts valid image block', () => {
    expect(() => validateBlockData(BlockType.IMAGE, { assetId: VALID_UUID, caption: 'A castle' })).not.toThrow();
  });

  it('rejects image block without assetId', () => {
    expect(() => validateBlockData(BlockType.IMAGE, { caption: 'x' })).toThrow(DomainError);
  });

  it('accepts valid gallery block', () => {
    expect(() => validateBlockData(BlockType.GALLERY, { assetIds: [VALID_UUID] })).not.toThrow();
  });

  it('rejects gallery block with non-uuid assets', () => {
    expect(() => validateBlockData(BlockType.GALLERY, { assetIds: ['not-a-guid'] })).toThrow(DomainError);
  });

  it('accepts valid quote block', () => {
    expect(() => validateBlockData(BlockType.QUOTE, { content: 'To be', attribution: 'King' })).not.toThrow();
  });

  it('rejects quote block without content', () => {
    expect(() => validateBlockData(BlockType.QUOTE, { attribution: 'King' })).toThrow(DomainError);
  });

  it('accepts valid callout block', () => {
    expect(() => validateBlockData(BlockType.CALLOUT, { content: 'Note', emoji: '💡' })).not.toThrow();
  });

  it('accepts divider with empty data', () => {
    expect(() => validateBlockData(BlockType.DIVIDER, {})).not.toThrow();
  });

  it('accepts valid table block', () => {
    expect(() => validateBlockData(BlockType.TABLE, { headers: ['A', 'B'], rows: [['1', '2']] })).not.toThrow();
  });

  it('rejects table block with non-string rows', () => {
    expect(() => validateBlockData(BlockType.TABLE, { rows: [[1, 2]] })).toThrow(DomainError);
  });

  it('accepts valid embed block', () => {
    expect(() => validateBlockData(BlockType.EMBED, { url: 'https://example.com', caption: 'x' })).not.toThrow();
  });

  it('rejects embed block with invalid url', () => {
    expect(() => validateBlockData(BlockType.EMBED, { url: 'not-a-url' })).toThrow(DomainError);
  });
});

describe('normalizeBlockData', () => {
  it('fills default rows for table', () => {
    expect(normalizeBlockData(BlockType.TABLE, { headers: ['A'] })).toEqual({ headers: ['A'], rows: [] });
  });

  it('passes other types through', () => {
    const data = { content: 'x' };
    expect(normalizeBlockData(BlockType.TEXT, data)).toBe(data);
  });
});

describe('blockToText', () => {
  it('extracts text content', () => {
    expect(blockToText({ type: BlockType.TEXT, data: { content: 'Hello' } })).toBe('Hello');
  });

  it('combines quote content and attribution', () => {
    expect(blockToText({ type: BlockType.QUOTE, data: { content: 'To be', attribution: 'King' } })).toBe('To be King');
  });

  it('extracts caption from image', () => {
    expect(blockToText({ type: BlockType.IMAGE, data: { assetId: VALID_UUID, caption: 'Castle' } })).toBe('Castle');
  });

  it('flattens table rows', () => {
    expect(blockToText({ type: BlockType.TABLE, data: { headers: ['A'], rows: [['1'], ['2']] } })).toBe('A 1 2');
  });

  it('returns empty string for divider', () => {
    expect(blockToText({ type: BlockType.DIVIDER, data: {} })).toBe('');
  });
});