import "dotenv/config";

import { runAgent } from "./agent";

async function main() {
  const result = await runAgent({
    question: `
Check order 0b466c15-d06b-4859-b5b7-4102514bc675.

First look up the order's current status using the order lookup tool.
Then use the authoritative ParcelPilot documentation to determine
whether that status has any relevant operational meaning or known
issue.

Give me a concise combined answer based only on the tool results.
    `,
    accountId: "ACCT-001",
  });

  console.dir(result, {
    depth: null,
  });
}

main().catch((error) => {
  console.error("Multi-tool agent test failed:", error);
  process.exit(1);
});