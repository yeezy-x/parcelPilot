import "dotenv/config";

import { buildRagContext } from "./context";
import { retrieveChunks } from "@/lib/rag/retrieval";
import { rankRetrievalResults } from "@/lib/rag/rank";
import { resolveAuthority } from "@/lib/rag/resolve-authority";

type TestCase = {
  name: string;

  query: string;

  accountId: string | null;

  expectedPrimaryFile: string;

  expectedPrimaryAuthority: string;

  expectedText: string;
};

const TESTS: TestCase[] = [
  // ---------------------------------------------------------
  // TEST 1
  // Account-specific agreement overrides global policy
  // ---------------------------------------------------------
  {
    name: "Account-specific override",

    query:
      "What is the P1 response target?",

    accountId: "ACCT-001",

    expectedPrimaryFile:
      "05_Northstar_Logistics_Enterprise_Agreement.pdf",

    expectedPrimaryAuthority:
      "ACCOUNT_AGREEMENT",

    expectedText:
      "P1: 15 minutes, 24x7",
  },

  // ---------------------------------------------------------
  // TEST 2
  // Historical/deprecated policy
  // ---------------------------------------------------------
  {
    name: "Historical policy",

    query:
      "What was the Enterprise P1 response target in Support Policy v2?",

    accountId: null,

    expectedPrimaryFile:
      "02_Support_Policy_v2_DEPRECATED.pdf",

    expectedPrimaryAuthority:
      "HISTORICAL",

    expectedText:
      "Enterprise 1 hour",
  },

  // ---------------------------------------------------------
  // TEST 3
  // Current global policy
  // ---------------------------------------------------------
  {
    name: "Current policy",

    query:
      "What is the current Enterprise P1 response target?",

    accountId: null,

    expectedPrimaryFile:
      "01_Support_Policy_v3_CURRENT.pdf",

    expectedPrimaryAuthority:
      "CURRENT_POLICY",

    expectedText:
      "Enterprise 30 minutes, 24x7",
  },

  // ---------------------------------------------------------
  // TEST 4
  // Product documentation
  // ---------------------------------------------------------
  {
    name: "Bulk Upload",

    query:
      "What is the Bulk Upload limit for Enterprise customers?",

    accountId: null,

    expectedPrimaryFile:
      "04_Product_Operations_Guide_and_Known_Issues.pdf",

    expectedPrimaryAuthority:
      "CURRENT_PRODUCT_DOC",

    expectedText:
      "5,000 rows",
  },
];

async function runTest(
  test: TestCase,
): Promise<boolean> {
  const retrieved = await retrieveChunks(
    test.query,
    {
      topK: 10,
      accountId: test.accountId ?? undefined,
    },
  );

  const ranked =
    rankRetrievalResults(
      test.query,
      retrieved,
    );

  const resolution =
    resolveAuthority(ranked);

  const context =
    buildRagContext(
      test.query,
      test.accountId,
      resolution.primary,
      resolution.supporting,
    );

  const primary = context.primary;

  const filePassed =
    primary.sourceFile ===
    test.expectedPrimaryFile;

  const authorityPassed =
    primary.authorityClass ===
    test.expectedPrimaryAuthority;

  const textPassed =
    primary.text.includes(
      test.expectedText,
    );

  const passed =
    filePassed &&
    authorityPassed &&
    textPassed;

  if (passed) {
    console.log(
      `PASS | ${test.name}`,
    );

    return true;
  }

  console.log(
    `FAIL | ${test.name}`,
  );

  console.log(
    `  Expected file: ${test.expectedPrimaryFile}`,
  );

  console.log(
    `  Actual file:   ${primary.sourceFile}`,
  );

  console.log(
    `  Expected authority: ${test.expectedPrimaryAuthority}`,
  );

  console.log(
    `  Actual authority:   ${primary.authorityClass}`,
  );

  console.log(
    `  Expected text: ${test.expectedText}`,
  );

  return false;
}

async function main() {
  console.log(
    "========== #6.8 CONTEXT EVALUATION ==========",
  );

  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    try {
      const result =
        await runTest(test);

      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;

      console.log(
        `FAIL | ${test.name}`,
      );

      console.log(
        `  Error: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  console.log(
    "\n========== RESULT ==========",
  );

  console.log(
    `Passed: ${passed}/${TESTS.length}`,
  );

  console.log(
    `Failed: ${failed}/${TESTS.length}`,
  );

  if (failed > 0) {
    console.log(
      "❌ #6.8 FAILED",
    );

    process.exit(1);
  }

  console.log(
    "✅ #6.8 PASSED",
  );
}

main().catch((error) => {
  console.error(
    "Evaluation failed:",
    error,
  );

  process.exit(1);
});