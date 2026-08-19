export interface ParsedMarkdownReference {
  name: string;
  label: string | null;
}

const REFERENCE_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function parseMarkdownReferences(content: string): ParsedMarkdownReference[] {
  if (!content) {
    return [];
  }

  const references: ParsedMarkdownReference[] = [];
  let match: RegExpExecArray | null;

  REFERENCE_PATTERN.lastIndex = 0;

  while ((match = REFERENCE_PATTERN.exec(content)) !== null) {
    const name = match[1]?.trim();
    if (!name) {
      continue;
    }
    const label = match[2]?.trim() ?? null;
    references.push({ name, label });
  }

  return references;
}