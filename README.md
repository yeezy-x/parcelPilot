# ParcelPilot AI Support Agent

Customer-support chatbot for the ParcelPilot assessment pack. It answers natural-language questions using retrieved PDFs and Postgres operational data, and it creates escalations only after explicit confirmation.

## Overview

The UI (`src/app/page.tsx`) posts to `POST /api/chat`. The route validates `accountId` as `ACCT-001` or `ACCT-002`, then runs `runAgent` (`src/lib/agent/agent.ts`).

The agent uses Google Gemini function calling with three tools:

- `searchDocuments` — vector search over ingested PDFs, then authority ranking
- `lookupOrder` — account-scoped order lookup
- `createEscalation` — state-changing write, blocked until the user confirms

Longer design notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Product framing: [docs/PRODUCT.md](docs/PRODUCT.md).

## Architecture

```
Browser → POST /api/chat → runAgent (Gemini, max 5 tool iterations)
                │
                ├─ searchDocuments → retrieveChunks (pgvector) → rank → resolveAuthority
                ├─ lookupOrder     → Prisma Order (accountId + orderId)
                └─ createEscalation → pending confirmation → Prisma Escalation (on confirm only)
```

Postgres holds accounts, orders, tickets, escalations, document metadata, and `vector(768)` chunk embeddings. Prisma 7 uses the `pg` driver adapter (`src/lib/db/prisma.ts`).

## RAG Pipeline

1. Ingest PDFs from `data/` (`scripts/ingest/run-docs.ts`): parse, Chonkie recursive chunks (~250 tokens), Gemini embeddings, store in `document_chunks`.
2. At query time, embed the question (`src/lib/rag/embed-query.ts`).
3. Cosine-style search via `embedding <=> vector` (`src/lib/rag/retrieval.ts`), filtered to global docs (`account_id IS NULL`) plus the active account’s agreements.
4. Rank by similarity, lexical overlap, query intent (current vs historical), and authority class (`src/lib/rag/rank.ts`).
5. Pick primary vs supporting evidence (`src/lib/rag/resolve-authority.ts`).
6. Return `{ found, primary, supporting }` to Gemini. The model is instructed not to invent facts outside tool results.

Structured rows (accounts / orders / tickets) are ingested separately from `data/ParcelPilot_Assessment_Data.xlsx` (`npm run ingest`). They are **not** embedded.

## Source Authority

Document class is derived from `doc_type` + `authority_status` (`src/lib/rag/authority.ts`):


| Class               | Priority | Typical sources                          |
| ------------------- | -------- | ---------------------------------------- |
| ACCOUNT_AGREEMENT   | 100      | Account-scoped CURRENT/ACTIVE agreements |
| CURRENT_POLICY      | 80       | Global current policy                    |
| CURRENT_SOP         | 75       | Global current SOP                       |
| CURRENT_PRODUCT_DOC | 60       | Current product/ops guide                |
| HISTORICAL          | 10       | DEPRECATED / HISTORICAL                  |
| UNKNOWN             | 0        | Anything else                            |


Resolution rule (simplified): among near-top results, a current account agreement beats current policy/SOP when both are relevant. Historical chunks are boosted only when the query looks historical (`detectQueryIntent`).

Registered pack (`scripts/ingest/documents.ts`):

- `01_Support_Policy_v3_CURRENT.pdf` — POLICY, CURRENT, global
- `02_Support_Policy_v2_DEPRECATED.pdf` — POLICY, DEPRECATED, global
- `03_Cancellation_and_Service_Credit_SOP_v4.pdf` — SOP, CURRENT, global
- `04_Product_Operations_Guide_and_Known_Issues.pdf` — PRODUCT_DOC, CURRENT, global
- `05_Northstar_Logistics_Enterprise_Agreement.pdf` — AGREEMENT, CURRENT, `ACCT-001`
- `06_LumenWorks_Service_Agreement.pdf` — AGREEMENT, CURRENT, `ACCT-002`



## Agent Architecture

`runAgent`:

1. If a pending `createEscalation` exists, interpret the user message as confirm / reject / neither (`src/lib/agent/confirmation-utils.ts`). Confirm executes the tool; reject clears pending state and does not write; neither re-asks.
2. Otherwise call Gemini with `GEMINI_TOOLS` and a system instruction: use tools for policies/orders/escalations; do not invent; never use another account; do not claim an escalation was created unless the tool succeeded.
3. The server **injects** `request.accountId` into tool args for `searchDocuments`, `lookupOrder`, and `createEscalation`.
4. If Gemini calls `createEscalation`, the loop **returns immediately** with `confirmation_required` and does **not** execute the write.
5. Other tools run, results are appended as function responses, and the loop continues (cap: 5 iterations).

The UI `View` control (`customer` / `internal`) is display-only. It is not sent to `/api/chat` and does not change retrieval or isolation.

## Tools



### searchDocuments

`src/lib/agent/tools/search-document.ts`. Requires `accountId`; without it returns `{ found: false }`. Retrieves up to 8 chunks, ranks, resolves authority.

### lookupOrder

`src/lib/agent/tools/lookup-data.ts`. `findFirst` on `accountId` and `orderId` (or UUID `id`). Missing or other-account orders return `{ found: false, order: null }`.

### createEscalation

`src/lib/agent/tools/create-escalation.ts`. Loads the ticket **for this account**, maps P1/P2/P3 (or HIGH/MEDIUM/LOW) onto `TicketSeverity`, inserts `EscalationStatus.CREATED`. Wrong-account or unknown tickets throw.

## Confirmation / Safety

Write path is application-enforced, not prompt-only:

1. Model may **prepare** `createEscalation`.
2. Server stores pending args and returns `confirmation_required`.
3. UI shows Confirm / Cancel (`yes` / `no`).
4. Only an allowed confirmation phrase runs `executeAgentTool("createEscalation", ...)`.
5. Rejection phrases clear pending state with no insert.

Positive set: `yes`, `yes please`, `confirm`, `confirmed`, `do it`, `go ahead`, `create it`, `proceed`.  
Negative set: `no`, `no thanks`, `cancel`, `don't`, `do not`, `stop`.

Pending state is a **process-global in-memory variable** (`src/lib/agent/confirmation.ts`) plus a **client echo** of `pendingConfirmation` on each chat request. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for why that is a trade-off.

## Account Isolation

- Chat schema allows only `ACCT-001` and `ACCT-002`.
- Order lookup and ticket lookup for escalation are filtered by `accountId`.
- Document retrieval: `(d.account_id IS NULL OR d.account_id = :accountId)`.
- Northstar’s agreement is not in LumenWorks’ retrieval set, and vice versa.

This is query-layer scoping, not a separate auth product.

## Data Model

Prisma models: `Account`, `Order`, `Ticket`, `Escalation`, `Document`, `DocumentChunk` (`prisma/schema.prisma`). Chunk embeddings are `Unsupported("vector(768)")` (pgvector).

## Gemini Configuration

Hosted Gemini via `@google/genai` (`GoogleGenAI` + `GEMINI_API_KEY`).


| Variable               | Role                        | Example in `.env.example`    |
| ---------------------- | --------------------------- | ---------------------------- |
| `LLM_MODEL`            | Chat / function calling     | `gemini-3.7-flash`           |
| `EMBEDDING_MODEL`      | Query and ingest embeddings | `gemini-embedding-2-preview` |
| `EMBEDDING_DIMENSIONS` | Must match the column       | `768`                        |


If `LLM_MODEL` is unset, `agent.ts` currently falls back to `"gpt-4o-mini"`. That string is not a Gemini model id; set `LLM_MODEL` in every environment.

There is no local/Ollama production path in this repo.

## Environment Variables

Copy `.env.example` to `.env` (gitignored):

```
GEMINI_API_KEY=
LLM_MODEL=gemini-3.7-flash
EMBEDDING_MODEL=gemini-embedding-2-preview
EMBEDDING_DIMENSIONS=768
DATABASE_URL=
```

Never commit real keys or connection strings.

## Local Setup

```bash
npm install
cp .env.example .env   # then fill values
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Optional: `GET /api/health/db` checks Postgres and lists accounts.

## Database Setup

1. PostgreSQL with pgvector.
2. `DATABASE_URL` in `.env` and `prisma.config.ts`.
3. Apply migrations: `npx prisma migrate deploy` (or `migrate dev` locally).
4. Structured data: `npm run ingest` (xlsx → accounts, orders, tickets).
5. Documents: `npm run ingest:docs` (PDFs → documents + embeddings). Related: `npm run register:docs`, `npm run verify`.

Ingest is not run automatically on `next dev`.

## Testing

There is no dedicated agent/RAG test suite in this repo. Remaining ingest helpers:

```bash
npm run verify                   # checks ingested structured data
npx tsx scripts/ingest/test.ts   # embedding smoke check (model + dimensions)
```

Confirmation, isolation, and grounding are intended to be checked with the demo script below (and by inspecting the database after escalate yes/no).

## Deployment

Intended path: this Next.js app on Vercel, same hosted Postgres (pgvector), same Gemini env vars.

`npm run build` runs `prisma generate && next build`. After deploy, set production env vars and run `prisma migrate deploy` against that database; ingest must already have been run (or run as a one-off) against the same DB.

This README does not claim a live production URL.

## Known Limitations

- Chat responses do not currently populate `citations` in the UI (`toChatResult` sets `citations: []`).
- `Role` is not an authorization boundary.
- In-memory pending confirmation is per process, not per user/session; concurrent users on one instance can collide. Client echo mitigates some of that for a single browser tab.
- Pending confirmation is not durable across server restarts.
- UI confirmation is English phrase matching, not a signed action token.
- Gemini and embeddings require network and a billed/hosted API.
- No evaluated production metric is reported in this repo.
- Agent, RAG authority, isolation, and confirmation test scripts were removed; they are not part of this submission.



## AI Tool Usage

AI coding tools used: **ChatGPT**.

Usage: code exploration, debugging assistance, implementation suggestions, and documentation support. Architecture decisions, validation, and final integration were reviewed and verified by a human.
