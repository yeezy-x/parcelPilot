import { lookupOrder } from "./tools/lookup-data";
import { createEscalation } from "./tools/create-escalation";
import { ToolDefinition } from "./types";
import { searchDocuments } from "./tools/search-document";

export type AgentToolName ="searchDocuments" | "lookupOrder" | "createEscalation";


export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "searchDocuments",
    description:"Search ParcelPilot's authoritative policies, agreements, SOPs, and product documentation.",
    risk: "READ_ONLY",
  },
  {
    name: "lookupOrder",
    description:"Look up an order belonging to the current customer account.",
    risk: "READ_ONLY",
  },
  {
    name: "createEscalation",
    description:"Create an escalation for a ticket. This changes system state and requires explicit user confirmation.",
    risk: "STATE_CHANGING",
  },
];

export async function executeAgentTool(
  name: AgentToolName,
  input: unknown,
) {
  switch (name) {
    case "searchDocuments":
      return searchDocuments(
        input as Parameters<typeof searchDocuments>[0],
      );

    case "lookupOrder":
      return lookupOrder(
        input as Parameters<typeof lookupOrder>[0],
      );

    case "createEscalation":
      return createEscalation(
        input as Parameters<typeof createEscalation>[0],
      );

    default: {
      const exhaustiveCheck: never = name;
      throw new Error(`Unknown agent tool: ${exhaustiveCheck}`);
    }
  }
}