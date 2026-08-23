import "dotenv/config";

import { runAgent } from "./agent";

const TICKET_ID =
  "ab07fd07-4105-4fcc-9035-c779650fc37d";

const ACCOUNT_ID = "ACCT-001";

async function testConfirmationAccepted() {
  console.log(
    "\n========================================",
  );

  console.log(
    "#8.7 TEST 1 — USER CONFIRMS",
  );

  console.log(
    "========================================\n",
  );

  /*
   * TURN 1
   */

  console.log(
    "========== TURN 1 ==========\n",
  );

  const first = await runAgent({
    question:
      `Create a P1 escalation for ticket ${TICKET_ID} ` +
      `with the summary "Real confirmation test".`,

    accountId: ACCOUNT_ID,
  });

  console.dir(first, {
    depth: null,
  });

  if (
    first.type !==
    "confirmation_required"
  ) {
    throw new Error(
      "FAIL: Expected confirmation_required.",
    );
  }

  console.log(
    "\nPASS | Agent requested confirmation",
  );

  /*
   * TURN 2
   */

  console.log(
    "\n========== TURN 2 ==========\n",
  );

  const second = await runAgent({
    question: "yes",

    accountId: ACCOUNT_ID,
  });

  console.dir(second, {
    depth: null,
  });

  if (second.type !== "final") {
    throw new Error(
      "FAIL: Expected final response after confirmation.",
    );
  }

  console.log(
    "\nPASS | User confirmation accepted",
  );

  console.log(
    "PASS | Escalation execution completed",
  );
}

async function testConfirmationRejected() {
  console.log(
    "\n========================================",
  );

  console.log(
    "#8.7 TEST 2 — USER REJECTS",
  );

  console.log(
    "========================================\n",
  );

  /*
   * TURN 1
   */

  console.log(
    "========== TURN 1 ==========\n",
  );

  const first = await runAgent({
    question:
      `Create a P1 escalation for ticket ${TICKET_ID} ` +
      `with the summary "Rejected confirmation test".`,

    accountId: ACCOUNT_ID,
  });

  console.dir(first, {
    depth: null,
  });

  if (
    first.type !==
    "confirmation_required"
  ) {
    throw new Error(
      "FAIL: Expected confirmation_required.",
    );
  }

  console.log(
    "\nPASS | Agent requested confirmation",
  );

  /*
   * TURN 2
   */

  console.log(
    "\n========== TURN 2 ==========\n",
  );

  const second = await runAgent({
    question: "no",

    accountId: ACCOUNT_ID,
  });

  console.dir(second, {
    depth: null,
  });

  if (second.type !== "final") {
    throw new Error(
      "FAIL: Expected final response after rejection.",
    );
  }

  if (
    !second.answer
      .toLowerCase()
      .includes("won't")
  ) {
    throw new Error(
      "FAIL: Expected rejection response.",
    );
  }

  console.log(
    "\nPASS | User confirmation rejected",
  );

  console.log(
    "PASS | Escalation was not executed",
  );
}

async function main() {
  await testConfirmationAccepted();

  await testConfirmationRejected();

  console.log(
    "\n========================================",
  );

  console.log(
    "#8.7 RESULT",
  );

  console.log(
    "========================================",
  );

  console.log(
    "PASS | Real confirmation conversation",
  );
}

main().catch((error) => {
  console.error(
    "\nFAIL | #8.7",
  );

  console.error(error);

  process.exit(1);
});