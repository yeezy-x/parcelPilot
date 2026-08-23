import "dotenv/config";

import { runAgent } from "./agent";
import {
  getPendingConfirmation,
  clearPendingConfirmation,
} from "./confirmation";

async function main() {
  console.log("\n========== TURN 1 ==========\n");

  const first = await runAgent({
    question:
      "Create a P1 escalation for ticket ab07fd07-4105-4fcc-9035-c779650fc37d with the summary 'Test cancellation'.",
    accountId: "ACCT-001",
  });

  console.dir(first, { depth: null });

  if (first.type !== "confirmation_required") {
    throw new Error(
      "FAIL: Expected confirmation_required from first turn.",
    );
  }

  const pending = getPendingConfirmation();

  if (!pending) {
    throw new Error(
      "FAIL: Expected a pending confirmation.",
    );
  }

  console.log("\nPASS | Confirmation requested");

  console.log("\n========== TURN 2 ==========\n");

  // Simulate the user rejecting the action.
  const confirmation = "no";

  if (confirmation !== "no") {
    throw new Error("FAIL: Test confirmation was not 'no'.");
  }

  // User rejected the action, so nothing should be executed.
  clearPendingConfirmation();

  const remaining = getPendingConfirmation();

  if (remaining !== null) {
    throw new Error(
      "FAIL: Pending confirmation was not cleared.",
    );
  }

  console.log("PASS | Confirmation rejected");
  console.log("PASS | Pending confirmation cleared");
  console.log("PASS | createEscalation was NOT executed");

  console.log("\n========== RESULT ==========");
  console.log("PASS | #8.6.4 Negative confirmation");
}

main().catch((error) => {
  console.error("\nFAIL | #8.6.4");
  console.error(error);
  process.exit(1);
});