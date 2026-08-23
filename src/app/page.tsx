"use client";

import { FormEvent, useState } from "react";
import type {AccountId, Role, ChatResult, PendingConfirmation, Proposal, ChatApiResponse} from "@/lib/types";

type Message = {
  id: string;
  side: "user" | "assistant";
  text: string;
  result?: ChatResult;
};

const starters = [
  "Can Northstar cancel ORD-1001 without a cancellation fee?",
  "A pickup is three hours late because of carrier fault. Should I get a service credit?",
  "Please escalate this urgent delivery issue",
];

function mapSeverity(value: unknown): Proposal["severity"] {
  const raw = String(value ?? "medium").toLowerCase();
  if (raw.includes("p1") || raw === "high") return "high";
  if (raw.includes("p3") || raw === "low") return "low";
  return "medium";
}

function toChatResult(data: ChatApiResponse): ChatResult {
  const tools =
    data.toolsUsed?.length > 0
      ? data.toolsUsed
      : data.tool
        ? [data.tool]
        : [];
  const args = data.pendingConfirmation?.arguments ?? {};

  return {
    answer: data.answer,
    citations: [],
    traces: tools.map((tool) => ({
      tool,
      detail:data.type === "confirmation_required"
          ? "Waiting for confirmation"
          : "Completed",
      status:data.type === "confirmation_required" ? "blocked" : "complete",
    })),
    proposal:
      data.type === "confirmation_required"
        ? {
            ticketId: String(args.ticketId ?? ""),
            severity: mapSeverity(args.severity),
            reason: String(args.reason ?? "Escalation proposed by agent"),
            summary: String(args.summary ?? data.answer),
          }
        : undefined,
  };
}

export default function Home() {
  const [role, setRole] = useState<Role>("customer");
  const [accountId, setAccountId] = useState<AccountId>("ACCT-001");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      side: "assistant",
      text: "Hi — I’m ParcelPilot. I can check orders, current support guidance, and account-specific agreements. I’ll always ask before creating an escalation.",
    },
  ]);

  async function send(message: string) {
    if (!message.trim() || loading) return;
    setLoading(true);
    setMessages((items) => [
      ...items,
      { id: crypto.randomUUID(), side: "user", text: message },
    ]);
    setInput("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, accountId, pendingConfirmation }),
      });
      const data = (await response.json()) as ChatApiResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      setPendingConfirmation(data.pendingConfirmation ?? null);
      const result = toChatResult(data);
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          side: "assistant",
          text: result.answer,
          result,
        },
      ]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          side: "assistant",
          text:
            error instanceof Error ? error.message : "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function resetConversation() {
    setPendingConfirmation(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        side: "assistant",
        text: "New conversation started. What can I help you resolve?",
      },
    ]);
  }

  const accountName = accountId === "ACCT-001" ? "Northstar Logistics" : "LumenWorks";

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">↗</span>
          <span>ParcelPilot</span>
        </div>
        <div className="side-label">WORKSPACE</div>
        <button className="new-chat" type="button" onClick={resetConversation}>
          ＋ New conversation
        </button>
        <div className="security-note">
          <span>◈</span>
          <div>
            <strong>Scoped access is on</strong>
            <p>Customer data is filtered at the query layer.</p>
          </div>
        </div>
        <div className="snapshot">
          <span className="pulse" /> Data snapshot
          <br />
          <strong>Feb 14, 2025 · 15:00 UTC</strong>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI SUPPORT CONSOLE</p>
            <h1>Resolve with confidence.</h1>
          </div>
          <div className="controls">
            <label className="select-wrap">
              <span>View</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="customer">Customer</option>
                <option value="internal">Internal</option>
              </select>
            </label>
            <label className="select-wrap">
              <span>Active account</span>
              <select
                value={accountId}
                onChange={(e) =>
                  setAccountId(e.target.value as AccountId)
                }
              >
                <option value="ACCT-001">Northstar</option>
                <option value="ACCT-002">LumenWorks</option>
              </select>
            </label>
            <div className="avatar">{accountName.slice(0, 1)}</div>
          </div>
        </header>
        <div className="context-bar">
          <span className="dot" />
          <strong>
            {role === "internal"
              ? "Internal staff workspace"
              : `${accountName} customer workspace`}
          </strong>
          <span>•</span>
          <span>Agreement-aware answers</span>
          <span>•</span>
          <span>Current sources only</span>
        </div>
        <section className="conversation" aria-live="polite">
          {messages.map((message) => (
            <article className={`message ${message.side}`} key={message.id}>
              <div className="message-label">
                {message.side === "user" ? "YOU" : "PARCELPILOT"}
              </div>
              <div className="bubble">{message.text}</div>
              {message.result && (
                <ResultDetails
                  result={message.result}
                  onConfirm={() => void send("yes")}
                  onCancel={() => void send("no")}
                />
              )}
            </article>
          ))}
          {loading && (
            <div className="thinking">
              <i />
              <i />
              <i /> Checking authorized sources…
            </div>
          )}
        </section>
        <div className="composer-area">
          <div className="starters">
            {starters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => void send(starter)}
              >
                {starter}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="composer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about an order, policy, or ticket…"
            />
            <button
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>
          <p>
            Answers cite current sources and respect account-level access
            controls.
          </p>
        </div>
      </section>
    </main>
  );
}

function ResultDetails({
  result,
  onConfirm,
  onCancel,
}: {
  result: ChatResult;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="details">
      {result.traces.length > 0 && (
        <details>
          <summary>
            <span className="trace-icon">⌘</span> Tool activity{" "}
            <em>{result.traces.length}</em>
          </summary>
          <div className="traces">
            {result.traces.map((trace, index) => (
              <div
                className={`trace ${trace.status}`}
                key={`${trace.tool}-${index}`}
              >
                <strong>{trace.tool}</strong>
                <span>{trace.detail}</span>
              </div>
            ))}
          </div>
        </details>
      )}
      {result.citations.length > 0 && (
        <div className="citations">
          {result.citations.map((citation) => (
            <div className="citation" key={citation.sourceFile}>
              <span>▤</span>
              <div>
                <strong>
                  {citation.sourceFile.replace(".pdf", "").replaceAll("_", " ")}
                </strong>
                <small>
                  {citation.tier} · Effective {citation.effectiveDate}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
      {result.proposal && (
        <div className="proposal">
          <div>
            <span className="alert">!</span>
            <div>
              <p>Proposed escalation</p>
              <strong>
                {result.proposal.ticketId} · {result.proposal.severity} priority
              </strong>
              <small>{result.proposal.summary}</small>
            </div>
          </div>
          <div className="proposal-actions">
            <button className="cancel" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="confirm" type="button" onClick={onConfirm}>
              Confirm escalation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}