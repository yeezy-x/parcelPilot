# Product note

## Extra client problem: Trust and Reliability

The extra problem this submission leans on is **Trust and Reliability**: answers should be attributable to the right source, scoped to the right customer, and honest when evidence is missing. State changes should not be silent.

How the current system supports that:

- **Source precedence** — After retrieval, `resolveAuthority` picks a primary chunk. Current account agreements outrank current global policy/SOP when both are relevant.
- **Authority ranking** — `getAuthorityClass` / `getAuthorityPriority` plus intent-aware score tweaks so deprecated policy is not the default “current” answer.
- **Account overrides** — Northstar (`ACCT-001`) and LumenWorks (`ACCT-002`) have distinct agreement PDFs. Retrieval includes only global docs plus that account’s agreement. Order and ticket writes/lookups are account-filtered.
- **Uncertainty** — Tools return `found: false` rather than fake rows. The agent instruction is not to invent facts outside tool results. Unsupported questions (e.g. a missing phone number) are expected to refuse rather than fabricate; this is checked in the demo path, not by an in-repo eval harness.
- **Confirmation before actions** — Escalations are not inserted when Gemini first calls `createEscalation`. The user must confirm; rejection does not mutate.

This is query-time reliability, not a full audit/compliance product. The chat UI currently shows tool traces and a confirmation card; it does **not** yet render document citations from the API (the client sets `citations` to an empty array).

## What would be built next

1. Pass primary/supporting `sourceFile` (and authority class) through `/api/chat` and render citations.
2. Durable, per-session pending actions (DB or signed token) instead of process memory + unsigned client echo.
3. Wire `Role` only if the assessment/product actually needs staff vs customer document visibility; today it is cosmetic.
4. A small offline eval set over the real pack (P1 override, isolation, unsupported, confirm/reject) with pass/fail — not a dashboard of invented KPIs. Dedicated test scripts for this were removed from the submission.
5. Sign or hash pending escalation arguments so the client cannot change `ticketId` / `severity` before confirm.

## Intentional omissions

Left out on purpose (scope/time, existing stack):

- Second LLM provider, local inference, agent frameworks, extra vector databases, extra ORMs
- AuthN/AuthZ product (SSO, row-level security beyond `accountId` filters)
- Conversation memory beyond pending confirmation
- Automatic citation UI
- Human-in-the-loop review queue beyond yes/no escalation
- Recording the ~5 minute demo video (see README demo script)
- Dedicated agent/RAG/confirmation test files (removed; demo script is the remaining check path)

## One metric: grounded resolution rate

**Definition (not measured in this repo):** share of assistant turns that (a) answer using retrieved **primary** evidence from `searchDocuments` and/or a successful `lookupOrder`, versus (b) explicitly refuse or mark uncertainty when tools return no evidence.

Why this metric, not “CSAT” or “resolution rate”:

- It matches the trust problem: did we ground, or did we guess?
- It can be computed from logs already implied by the design (`toolsUsed`, `found`, `primary.sourceFile`, refusal language) without a labeled outcome team.
- Escalation accuracy and human-override rate matter later; they need ticket-outcome labels this pack does not provide.

**No production number is reported here.** There is no eval harness in-repo that emits this rate. Do not fill in a fake percentage for the submission.
