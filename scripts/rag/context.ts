import { RankedRetrievalResult } from "@/lib/rag/retrieval.types";
import type {
    ContextSource,
    RagContext,
  } from "./context.types";
  
  function toContextSource(
    result: RankedRetrievalResult,
  ): ContextSource {
    return {
      chunkId: result.chunkId,
      documentId: result.documentId,
      sourceFile: result.sourceFile,
      chunkIndex: result.chunkIndex,
      pageStart: result.pageStart!,
      pageEnd: result.pageEnd!,
      documentType: result.documentType,
      authorityStatus: result.authorityStatus,
      authorityClass: result.authorityClass,
      similarity: result.similarity,
      finalScore: result.finalScore,
      text: result.chunkText,
    };
  }

  export function buildRagContext(
    query: string,
    accountId: string | null,
    primary: RankedRetrievalResult,
    supporting: RankedRetrievalResult[],
  ): RagContext {
    return {
      query,
      accountId,
      primary: toContextSource(primary),
      supporting:supporting.map(toContextSource),
    };
  }