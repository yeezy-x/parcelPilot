import { retrieveChunks } from "@/lib/rag/retrieval";
import { resolveAuthority } from "@/lib/rag/resolve-authority";

import { buildRagContext } from "./context";
import { generateAnswer } from "./generate";
import { RankedRetrievalResult } from "@/lib/rag/retrieval.types";

export type RagRequest = {
  question: string;
  accountId?: string;
};

export async function answerWithRag(request: RagRequest) {
  const chunks = await retrieveChunks(request.question, {
    accountId: request.accountId,
    topK: 8,
    minSimilarity: 0,
  });

  if (chunks.length === 0) {
    return {
      answer:"I could not find enough relevant information in the available sources to answer this question.",
      primary: null,
      supporting: [],
    };
  }

  const resolved = resolveAuthority(chunks as RankedRetrievalResult[]);

  const context = buildRagContext(
    request.question,
    request.accountId ?? null,
    resolved.primary,
    resolved.supporting,
  );

  const generated = await generateAnswer({
    question: request.question,
    context: context.toString(),
  });

  return {
    answer: generated.answer,
    primary: resolved.primary,
    supporting: resolved.supporting,
  };
}