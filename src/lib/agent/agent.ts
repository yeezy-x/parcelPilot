import { GoogleGenAI } from "@google/genai";

import { GEMINI_TOOLS } from "./gemini-tools";


import {
  setPendingConfirmation,
} from "./confirmation";
import { AgentToolName, executeAgentTool } from "./tools";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL =
  process.env.GEMINI_GENERATION_MODEL ??
  "gemini-3.6-flash";

const MAX_ITERATIONS = 5;

export type AgentRequest = {
  question: string;
  accountId?: string;
};

export async function runAgent(
  request: AgentRequest,
) {
  const contents: any[] = [
    {
      role: "user",
      parts: [
        {
          text: request.question,
        },
      ],
    },
  ];

  for (
    let iteration = 0;
    iteration < MAX_ITERATIONS;
    iteration++
  ) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        tools: GEMINI_TOOLS,

        systemInstruction: `
You are the ParcelPilot support AI agent.

Rules:

1. Use searchDocuments when the answer requires ParcelPilot
   policies, agreements, SOPs, or product documentation.

2. Use lookupOrder when the user asks about a specific order.

3. Never invent information that is not present in tool results.

4. The current customer account is:
   ${request.accountId ?? "none provided"}

5. Never access data belonging to another account.

6. When the user requests an escalation, you may call
   createEscalation to prepare the requested action.

   The application enforces the confirmation requirement before
   the state-changing operation is executed.

   Do not claim that an escalation was created unless the
   createEscalation tool actually returns a successful result.

7. When a tool returns authoritative evidence, base your answer
   on that evidence.

8. Keep answers concise and directly answer the user's question.
        `,
      },
    });

    const functionCalls = response.functionCalls ?? [];

    /*
     * Gemini has finished and produced a normal answer.
     */
    if (functionCalls.length === 0) {
      return {
        type: "final" as const,
        answer: response.text ?? "",
      };
    }

    /*
     * Preserve Gemini's function-call message so that the
     * next Gemini turn knows which tool it requested.
     */
    contents.push({
      role: "model",
      parts:
        response.candidates?.[0]?.content?.parts ?? [],
    });

    const functionResponseParts = [];

    for (const call of functionCalls) {
      if (!call.name) {
        continue;
      }

      const toolName = call.name as AgentToolName;

      const args =
        (call.args ?? {}) as Record<string, unknown>;

      /*
       * Account identity comes from trusted application
       * context, not from Gemini.
       */
      if (
        toolName === "searchDocuments" ||
        toolName === "lookupOrder" ||
        toolName === "createEscalation"
      ) {
        if (request.accountId) {
          args.accountId = request.accountId;
        }
      }

      /*
       * STATE-CHANGING TOOL GATE
       *
       * Never execute createEscalation automatically.
       *
       * Store the requested operation and return a
       * confirmation request to the application.
       */
      if (toolName === "createEscalation") {
        setPendingConfirmation({
          toolName: "createEscalation",
          arguments: args,
        });

        return {
          type: "confirmation_required" as const,
          tool: toolName,
          arguments: args,
          message:
            "This action will create an escalation and change system state. Please confirm if you want me to proceed.",
        };
      }

      /*
       * READ-ONLY tools can execute immediately.
       */
      const result = await executeAgentTool(
        toolName,
        args,
      );

      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: result,
          id: call.id,
        },
      });
    }

    /*
     * Send read-only tool results back to Gemini.
     *
     * Gemini gets another turn and can either:
     *
     *   1. call another tool
     *   2. produce the final answer
     */
    if (functionResponseParts.length > 0) {
      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    }
  }

  throw new Error(
    `Agent exceeded maximum tool iterations (${MAX_ITERATIONS}).`,
  );
}