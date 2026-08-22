import { getAuthorityClass } from "./authority";
import type { RankedRetrievalResult } from "./retrieval.types";

export type AuthorityResolution = {
  primary: RankedRetrievalResult;
  supporting: RankedRetrievalResult[];
};

const RELEVANCE_GAP = 0.15;

export function resolveAuthority(results: RankedRetrievalResult[]): AuthorityResolution {
  if (results.length === 0) {
    throw new Error("Cannot resolve authority from empty retrieval results.");
  }

  const topResult = results[0];
  const relevantCandidates = results.filter((result) => topResult.finalScore - result.finalScore <= RELEVANCE_GAP);
  const historicalCandidate = relevantCandidates.find((result) => getAuthorityClass(result) === "HISTORICAL");

  if (historicalCandidate && getAuthorityClass(topResult) === "HISTORICAL") {
    return {
      primary: historicalCandidate,
      supporting: relevantCandidates.filter((result) => result.chunkId !== historicalCandidate.chunkId),
    };
  }

  const accountAgreement = relevantCandidates.find((result) => getAuthorityClass(result) === "ACCOUNT_AGREEMENT");

  if (accountAgreement) {
    const topAuthorityClass = getAuthorityClass(topResult);

    if (topAuthorityClass === "CURRENT_POLICY" || topAuthorityClass === "CURRENT_SOP") {
      return {
        primary: accountAgreement,
        supporting: relevantCandidates.filter((result) => result.chunkId !== accountAgreement.chunkId),
      };
    }
  }

  return {
    primary: topResult,
    supporting: relevantCandidates.slice(1),
  };
}
