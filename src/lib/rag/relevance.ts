import type { RetrievalResult } from "./retrieval.types";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "what", "which",
  "for", "of", "to", "and", "or", "in", "on", "with", "does", "do",
  "how", "can", "customer", "target"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function lexicalRelevance(query: string, result: RetrievalResult): number {
  const queryTokens = new Set(tokenize(query));
  const chunkTokens = new Set(tokenize(result.chunkText));

  if (queryTokens.size === 0) {
    return 0;
  }

  let matches = 0;
  for (const token of queryTokens) {
    if (chunkTokens.has(token)) {
      matches++;
    }
  }

  return matches / queryTokens.size;
}
