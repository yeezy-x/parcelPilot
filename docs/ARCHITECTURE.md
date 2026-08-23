# Architecture

Factual description of the running system and why it looks this way. Not a redesign proposal.

## Agent

`runAgent` is a small Gemini function-calling loop (max 5 iterations), not a multi-agent framework.

- System rules live in the `generateContent` system instruction.
- Tool schemas live in `GEMINI_TOOLS`.
- Execution lives in `executeAgentTool`.
- Safety for writes is **outside** the model: `createEscalation` is intercepted before `executeAgentTool`.

Account id is taken from the HTTP body (enum-validated), then stamped onto tool arguments so the model cannot “choose” another tenant for those three tools.

## Tools

| Tool | Risk | Data | Side effect |
| --- | --- | --- | --- |
| searchDocuments | READ_ONLY | PDF chunks + metadata | None |
| lookupOrder | READ_ONLY | `orders` | None |
| createEscalation | STATE_CHANGING | `tickets` then `escalations` | Insert after confirm |

Documents and operational rows stay on different tools so the model cannot treat an Excel note as a policy, or a PDF sentence as an order status.

## Documents vs structured data

**Documents:** PDFs → pages → Chonkie chunks → Gemini embeddings → `document_chunks.embedding vector(768)`. Good for policies, SOPs, agreements, product notes. Authority is metadata on `documents`.

**Structured data:** xlsx sheets → validated/transformed rows → `accounts` / `orders` / `tickets`. Good for IDs, statuses, fees, timestamps, fault flags. Looked up by key, not kNN.

Mixing them in one vector index would blur “what is the order status?” with “what does the SOP say about cancellation?”

## Authority / reliability

Retrieval is similarity-first, then **re-ranked** (vector + lexical + intent + authority priority), then **resolved**:

- Near-duplicate scores (gap ≤ 0.15) are treated as competing candidates.
- Current account agreement wins over current policy/SOP when both are in that band.
- Deprecated policy remains in the index so historical questions can still retrieve it; current-intent queries down-rank HISTORICAL.

This is deterministic post-processing on retrieved chunks. It is not a second LLM judge.

## Account isolation

Enforced in SQL/Prisma, not only in the prompt:

- Orders: `accountId` + `orderId`.
- Escalations: ticket must belong to `accountId`.
- Chunks: global (`account_id` null) or matching account.

`searchDocuments` refuses to search if `accountId` is missing. The chat API will not accept an arbitrary account string.

## Confirmation

State-changing work is two-phase: propose (model + pending store) then execute (user confirm). Rejection is a first-class path. Ambiguous follow-ups re-prompt instead of guessing.

Phrase lists are small and exact after trim/lowercase. That is brittle but inspectable for the assessment.

## Trade-offs

### In-memory pending vs client-echo pending

**What exists:** module-level `let pendingConfirmation` **and** the client sending `pendingConfirmation` back on the next `POST /api/chat` (which calls `setPendingConfirmation`).

| | In-memory only | Client-echo only | Current hybrid |
| --- | --- | --- | --- |
| Multi-instance / serverless | Lost between invocations | Survives if the client holds the payload | Echo is what makes Vercel-style functions usable |
| Tampering | Server owns args | Client could alter args before confirm | Echo is trusted; not signed |
| Concurrency | One pending slot per process | Per browser tab | Global slot can still race if two users share an instance |

Chosen because the app is a single Next.js process locally and Fluid/serverless in production: **echo is required for pending to survive**. Signing the pending payload or storing it in Postgres would be the production hardening step; it was not added.

### Hosted Gemini vs local models

Chat and embeddings both use the Gemini API. Local models (Ollama, etc.) are not wired.

| | Hosted Gemini | Local |
| --- | --- | --- |
| Setup for this assessment | Matches existing `@google/genai` code | Extra runtime, different tool APIs |
| Embeddings | Same vendor as chat; 768-d column already set | Would require re-ingest |
| Privacy / cost / latency | Data leaves the app; needs `GEMINI_API_KEY` | Opposite profile |

Kept hosted so retrieval, ranking, and confirmation stay the submission focus.

### pgvector in Postgres vs a separate vector DB

Embeddings live next to operational tables in one Postgres.

| | pgvector here | Extra vector DB |
| --- | --- | --- |
| Ops | One `DATABASE_URL`, Prisma migrations | Second service, sync of ids/metadata |
| Isolation joins | `INNER JOIN documents` in the same query | App-side filter or dual writes |
| ANN features | Adequate for this corpus size | Stronger at large scale |

The PDF set is six files. A second store would not improve authority or isolation for this pack.
