import { retrieveChunks } from "@/lib/rag/retrieval";
import { resolveAuthority } from "@/lib/rag/resolve-authority";
import { rankRetrievalResults } from "@/lib/rag/rank";

export type SearchDocumentsInput = {
  query: string;
  accountId?: string;
};

export async function searchDocuments(input: SearchDocumentsInput) {
  const chunks = await retrieveChunks(input.query, {
    accountId: input.accountId,
    topK: 8,
    minSimilarity: 0,
  });

  if (chunks.length === 0) {
    return {
      found: false,
      primary: null,
      supporting: [],
    };
  }

  const rankedChunks = rankRetrievalResults(input.query, chunks);
  const resolved = resolveAuthority(rankedChunks);

  return {
    found: true,
    primary: resolved.primary,
    supporting: resolved.supporting,
  };
}
