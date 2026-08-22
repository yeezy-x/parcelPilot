export type ToolRisk = "READ_ONLY" | "STATE_CHANGING";

export type ToolDefinition = {
  name: string;
  description: string;
  risk: ToolRisk;
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
    {
      name: "searchDocuments",
      description:"Search authoritative ParcelPilot documents for policies, agreements, SOPs, and product documentation.",
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