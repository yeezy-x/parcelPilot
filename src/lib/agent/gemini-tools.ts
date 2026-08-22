import { Type } from "@google/genai";
import type { Tool } from "@google/genai";

export const GEMINI_TOOLS :Tool[]= [
  {
    functionDeclarations: [
      {
        name: "searchDocuments",
        description:"Search ParcelPilot's authoritative documents including current policies, customer agreements, SOPs, and current product documentation. Use this when the answer requires information from company documents.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:"The question or information to search for in the authoritative documents.",
            },
            accountId: {
              type: Type.STRING,
              description:"The current customer account ID. Include this when searching for account-specific information.",
            },
          },
          required: ["query"],
        },
      },

      {
        name: "lookupOrder",
        description:"Look up an order from the structured ParcelPilot database. Use this when the user asks about a specific order's status or details.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            orderId: {
              type: Type.STRING,
              description:"The ID of the order to look up.",
            },
            accountId: {
              type: Type.STRING,
              description:"The current customer account ID. Only orders belonging to this account may be accessed.",
            },
          },
          required: ["orderId"],
        },
      },

      {
        name: "createEscalation",
        description:"Create an escalation for a support ticket. This changes system state. NEVER execute this action without explicit confirmation from the user.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            ticketId: {
              type: Type.STRING,
              description:"The ID of the ticket that should be escalated.",
            },
            accountId: {
              type: Type.STRING,
              description:"The current customer account ID.",
            },
            severity: {
              type: Type.STRING,
              description:"The severity of the escalation, such as P1, P2, or P3.",
            },
            summary: {
              type: Type.STRING,
              description:"A concise explanation of why the ticket should be escalated.",
            },
          },
          required: ["ticketId", "accountId", "severity", "summary"],
        },
      },
    ],
  },
];