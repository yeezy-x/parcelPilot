export type Role = "customer" | "internal";
export type AccountId = "ACCT-001" | "ACCT-002";

export type SessionContext = { role: Role; accountId: AccountId };
export type Citation = { sourceFile: string; status: "current" | "deprecated"; effectiveDate: string; tier: string };
export type ToolTrace = { tool: string; detail: string; status: "complete" | "blocked" };
export type Proposal = { ticketId: string; severity: "low" | "medium" | "high"; reason: string; summary: string };
export type ChatResult = { answer: string; citations: Citation[]; traces: ToolTrace[]; proposal?: Proposal; refusal?: boolean };
