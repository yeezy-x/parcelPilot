import { getAuthorityClass, getAuthorityPriority } from "./authority";
import { detectQueryIntent } from "./query-intent";
import { lexicalRelevance } from "./relevance";
import type { RetrievalResult, RankedRetrievalResult } from "./retrieval.types";

export function rankRetrievalResults(query: string, results: RetrievalResult[]): RankedRetrievalResult[] {
  const intent = detectQueryIntent(query);

  return results
    .map((result) => {
      const authorityClass = getAuthorityClass(result);
      const authorityPriority = getAuthorityPriority(authorityClass);
      const lexicalScore = lexicalRelevance(query, result);

      let finalScore = result.similarity * 0.65 + lexicalScore * 0.35;

      if (intent === "HISTORICAL") {
        if (authorityClass === "HISTORICAL") {
          finalScore += 0.30;
        }
        if (authorityClass === "CURRENT_POLICY") {
          finalScore -= 0.20;
        }
      }

      if (intent === "CURRENT") {
        if (authorityClass === "HISTORICAL") {
          finalScore -= 0.30;
        }
      }

      if (lexicalScore > 0) {
        finalScore += authorityPriority / 2000;
      }

      return {
        ...result,
        authorityClass,
        authorityPriority,
        finalScore,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
