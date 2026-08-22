import { GoogleGenAI } from "@google/genai";
import { GEMINI_TOOLS } from "./gemini-tools";
import { AgentToolName, executeAgentTool } from "./tools";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_GENERATION_MODEL ?? "gemini-3.5-flash";
const MAX_ITERATIONS = 5;

export type AgentRequest = {
  question: string;
  accountId?: string;
};

export async function runAgent(request: AgentRequest) {
  const contents: any[] = [
    {
      role: "user",
      parts: [{ text: request.question }],
    },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
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
6. createEscalation changes system state and requires explicit
   user confirmation. Do not execute it automatically.
7. When a tool returns authoritative evidence, base your answer
   on that evidence.
8. Keep answers concise and directly answer the user's question.
`,
    },
});

    const functionCalls = response.functionCalls ?? [];
    if (functionCalls.length === 0) {
      return {
        type: "final" as const,
        answer: response.text ?? "",
      };
    }
    contents.push({
      role: "model",
      parts: response.candidates?.[0]?.content?.parts ?? [],
    });

    const functionResponseParts = [];

    for (const call of functionCalls) {
      if (!call.name) {
        continue;
      }

      const toolName = call.name as AgentToolName;
      const args = (call.args ?? {}) as Record<string, unknown>;

      if (toolName === "searchDocuments" || toolName === "lookupOrder") {
        if (request.accountId) {
          args.accountId = request.accountId;
        }
      }

      if (toolName === "createEscalation") {
        return {
          type: "confirmation_required" as const,
          tool: toolName,
          arguments: args,
        };
      }

      const result = await executeAgentTool(toolName, args);

      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: result,
          id: call.id,
        },
      });
    }

    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }

  throw new Error(`Agent exceeded maximum tool iterations (${MAX_ITERATIONS}).`);
}
