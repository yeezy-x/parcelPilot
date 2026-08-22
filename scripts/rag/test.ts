import { generateAnswer } from "./generate";

async function main() {
  const tests = [
    {
      name: "Supported question",
      question: "What is the P1 response target?",
      context: `
Source: 05_Northstar_Logistics_Enterprise_Agreement.pdf
Authority: ACCOUNT_AGREEMENT

For Northstar Logistics:
P1: 15 minutes, 24x7.
`,
      validate: (answer: string) => {
        const text = answer.toLowerCase();

        return (
          text.includes("15 minutes") &&
          text.includes("24x7")
        );
      },
    },

    {
      name: "Unsupported question",
      question: "What is Priya Mehta's phone number?",
      context: `
Source: 05_Northstar_Logistics_Enterprise_Agreement.pdf
Authority: ACCOUNT_AGREEMENT

Dedicated CSM: Priya Mehta.
No phone number is provided.
`,
      validate: (answer: string) => {
        const text = answer.toLowerCase();

        const doesNotHallucinatePhone =
          !/\b\d{10}\b/.test(text) &&
          !/\+\d[\d\s-]{7,}/.test(text);

        const acknowledgesMissingInformation =
          text.includes("no phone number") ||
          text.includes("not provided") ||
          text.includes("does not provide") ||
          text.includes("not available") ||
          text.includes("cannot determine") ||
          text.includes("cannot find");

        return (
          doesNotHallucinatePhone &&
          acknowledgesMissingInformation
        );
      },
    },
  ];

  let passed = 0;

  for (const test of tests) {
    console.log(`\n========== ${test.name} ==========`);

    const result = await generateAnswer({
      question: test.question,
      context: test.context,
    });

    console.log(result.answer);

    const pass = test.validate(result.answer);

    console.log(pass ? "PASS" : "FAIL");

    if (pass) {
      passed++;
    }
  }

  console.log(`\n========== RESULT ==========`);
  console.log(`Passed: ${passed}/${tests.length}`);

  if (passed !== tests.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Grounding test failed:", error);
  process.exit(1);
});