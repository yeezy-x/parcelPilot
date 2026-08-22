import "dotenv/config";


import {
  buildRagContext,
} from "./context";
import { retrieveChunks } from "@/lib/rag/retrieval";
import { rankRetrievalResults } from "@/lib/rag/rank";
import { resolveAuthority } from "@/lib/rag/resolve-authority";

async function main() {
  const query =
    "What is the P1 response target?";

  const accountId =
    "ACCT-001";

  console.log(
    `Query: ${query}`,
  );

  console.log(
    `Account: ${accountId}`,
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

  const resolution =
    resolveAuthority(ranked);

  const context =
    buildRagContext(
      query,
      accountId,
      resolution.primary,
      resolution.supporting,
    );

  console.dir(
    context,
    {
      depth: null,
    },
  );
}

main().catch((error) => {
  console.error(
    "Context test failed:",
    error,
  );

  process.exit(1);
});