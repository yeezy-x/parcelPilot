import "dotenv/config";

import {
  retrieveChunks,
} from "@/lib/rag/retrieval";

import {
  rankRetrievalResults,
} from "@/lib/rag/rank";

import {
  resolveAuthority,
} from "@/lib/rag/resolve-authority";

import {
  detectQueryIntent,
} from "@/lib/rag/query-intent";

async function runTest(
  query: string,
  accountId?: string,
) {
  console.log(
    "\n========================================",
  );

  console.log(
    `QUERY: ${query}`,
  );

  console.log(
    `ACCOUNT: ${accountId ?? "GLOBAL"}`,
  );

  console.log(
    `INTENT: ${detectQueryIntent(query)}`,
  );

  console.log(
    "========================================\n",
  );

  const retrieved =
    await retrieveChunks(
      query,
      {
        topK: 10,
        accountId,
      },
    );

  const ranked =
    rankRetrievalResults(
      query,
      retrieved,
    );

  console.log(
    "========== RANKED RESULTS ==========",
  );

  ranked.forEach(
    (result, index) => {
      console.log(
        [
          `${index + 1}.`,
          result.sourceFile,
          `authority=${result.authorityClass}`,
          `similarity=${result.similarity.toFixed(3)}`,
          `final=${result.finalScore.toFixed(3)}`,
        ].join(" | "),
      );
    },
  );

  const resolution =
    resolveAuthority(ranked);

  console.log(
    "\n========== PRIMARY ==========",
  );

  console.log(
    `Source: ${resolution.primary.sourceFile}`,
  );

  console.log(
    `Authority: ${resolution.primary.authorityStatus}`,
  );

  console.log(
    `Type: ${resolution.primary.documentType}`,
  );

  console.log(
    `Similarity: ${resolution.primary.similarity}`,
  );

  console.log(
    `\n${resolution.primary.chunkText}`,
  );
}

async function main() {
  await runTest(
    "What is the P1 response target?",
    "ACCT-001",
  );

  await runTest(
    "What was the historical P1 response target?",
    undefined,
  );

  await runTest(
    "What is the Bulk Upload limit?",
    "ACCT-001",
  );
}

main().catch((error) => {
  console.error(
    "\nRetrieval evaluation failed:",
  );

  console.error(error);

  process.exit(1);
});