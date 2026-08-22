import type { ContextSource } from "./context.types";

function getSourceKey(source: ContextSource): string {
  return `${source.documentId}:${source.chunkId}`;
}

export function deduplicateSources(
  sources: ContextSource[],
): ContextSource[] {
  const seen = new Set<string>();
  const result: ContextSource[] = [];
  for (const source of sources) {
    const key = getSourceKey(source);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(source);
  }
  return result;
}