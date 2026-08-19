import { describe, expect, it } from 'vitest';
import { parseMarkdownReferences } from '@taleorience/application';

describe('parseMarkdownReferences', () => {
  it('parses simple [[Name]]', () => {
    expect(parseMarkdownReferences('See [[Capital]] here')).toEqual([
      { name: 'Capital', label: null },
    ]);
  });

  it('parses [[Name|alias]]', () => {
    expect(parseMarkdownReferences('[[Moonlight Citadel|the citadel]]')).toEqual([
      { name: 'Moonlight Citadel', label: 'the citadel' },
    ]);
  });

  it('parses multiple references in order', () => {
    expect(parseMarkdownReferences('[[A]] and [[B|x]] and [[C]]')).toEqual([
      { name: 'A', label: null },
      { name: 'B', label: 'x' },
      { name: 'C', label: null },
    ]);
  });

  it('trims whitespace around name and label', () => {
    expect(parseMarkdownReferences('[[ Moonlight Citadel | столица ]]')).toEqual([
      { name: 'Moonlight Citadel', label: 'столица' },
    ]);
  });

  it('ignores empty name', () => {
    expect(parseMarkdownReferences('[[|label]] and [[]]')).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(parseMarkdownReferences('')).toEqual([]);
    expect(parseMarkdownReferences('no references here')).toEqual([]);
    expect(parseMarkdownReferences(null as unknown as string)).toEqual([]);
  });

  it('does not match malformed syntax', () => {
    expect(parseMarkdownReferences('[[Capital] and [[Capital')).toEqual([]);
  });
});