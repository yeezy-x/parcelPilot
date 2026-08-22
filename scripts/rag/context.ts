import { RankedRetrievalResult } from "@/lib/rag/retrieval.types";
import type {
    ContextSource,
    RagContext,
  } from "./context.types";
import { deduplicateSources } from "./context-cleanup";
import { orderSupportingSources } from "./context-order";
import { applyContextBudget } from "./context-budget";
  
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
    const primarySource = toContextSource(primary);
    const supportingSources = deduplicateSources(supporting
        .map(toContextSource))
        .filter((source)=>source.chunkId !== primarySource.chunkId)
    const orderedSupporting = orderSupportingSources(supportingSources);
    const budgetedSupporting = applyContextBudget(orderedSupporting);
    return {
      query,
      accountId,
      primary: primarySource,
      supporting: budgetedSupporting,
    };
  }