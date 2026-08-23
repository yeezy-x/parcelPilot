import { GoogleGenAI } from "@google/genai";
import { GEMINI_TOOLS } from "./gemini-tools";
import { executeAgentTool, type AgentToolName } from "./tools";
import {
  setPendingConfirmation,
  getPendingConfirmation,
  clearPendingConfirmation,
} from "./confirmation";
import { isConfirmation, isRejection } from "./confirmation-utils";
import { PendingConfirmation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_ITERATIONS = 5;

/** Free-tier Gemini models that support text + function calling. */
const FREE_TIER_CHAT_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

function chatModels(): string[] {
  const preferred = process.env.LLM_MODEL?.trim();
  return [...(preferred ? [preferred] : []), ...FREE_TIER_CHAT_MODELS].filter(
    (id, index, all) => all.indexOf(id) === index,
  );
}

function isRetryableModelError(error: unknown) {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: number }).status)
      : undefined;
  const message = error instanceof Error ? error.message : String(error);

  if (status === 401 || status === 403) return false;

  return (
    status === 404 ||
    status === 429 ||
    status === 500 ||
    status === 503 ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|quota|not found|404|429/i.test(
      message,
    )
  );
}

export type AgentRequest = {
  question: string;
  accountId?: string;
  pendingConfirmation?: PendingConfirmation;
};

function toolErrorResult(error: unknown) {
  return {
    error: error instanceof Error ? error.message : "Tool execution failed.",
  };
}

function systemInstruction(accountId?: string) {
  return `
You are the ParcelPilot support AI agent.
Rules:
1. Use searchDocuments when the answer requires ParcelPilot policies, agreements, SOPs, or product documentation.
2. Use lookupOrder when the user asks about a specific order.
3. Never invent information that is not present in tool results.
4. The current customer account is: ${accountId ?? "none provided"}
5. Never access data belonging to another account.
6. When the user requests an escalation, you may call createEscalation to prepare the requested action. The application enforces the confirmation requirement before the state-changing operation is executed. Do not claim that an escalation was created unless the createEscalation tool actually returns a successful result.
7. When a tool returns authoritative evidence, base your answer on that evidence.
8. Keep answers concise and directly answer the user's question.
        `;
}

async function runAgentLoop(model: string, request: AgentRequest) {
  const toolsUsed: string[] = [];
  const contents: any[] = [
    {
      role: "user",
      parts: [{ text: request.question }],
    },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        tools: GEMINI_TOOLS,
        systemInstruction: systemInstruction(request.accountId),
      },
    });

    const functionCalls = response.functionCalls ?? [];
    if (functionCalls.length === 0) {
      return {
        type: "final" as const,
        answer: response.text ?? "",
        tool: toolsUsed[0] ?? null,
        toolsUsed,
      };
    }

    contents.push({
      role: "model",
      parts: response.candidates?.[0]?.content?.parts ?? [],
    });

    const functionResponseParts: any[] = [];
    for (const call of functionCalls) {
      if (!call.name) continue;
      const toolName = call.name as AgentToolName;
      const args = (call.args ?? {}) as Record<string, unknown>;
      if (
        toolName === "searchDocuments" ||
        toolName === "lookupOrder" ||
        toolName === "createEscalation"
      ) {
        if (request.accountId) args.accountId = request.accountId;
      }
      toolsUsed.push(toolName);

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
          toolsUsed,
        };
      }

      let result: unknown;
      try {
        result = await executeAgentTool(toolName, args);
      } catch (error) {
        result = toolErrorResult(error);
      }

      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: result,
          id: call.id,
        },
      });
    }

    if (functionResponseParts.length > 0) {
      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    }
  }

  throw new Error(`Agent exceeded maximum tool iterations (${MAX_ITERATIONS}).`);
}

export async function runAgent(request: AgentRequest) {
  const pending = request.pendingConfirmation ?? getPendingConfirmation();

  if (pending) {
    if (isConfirmation(request.question)) {
      try {
        const args = {
          ...pending.arguments,
          ...(request.accountId ? { accountId: request.accountId } : {}),
        };
        const result = await executeAgentTool(pending.toolName, args);
        clearPendingConfirmation();
        return {
          type: "final" as const,
          answer:
            "success" in result
              ? "The escalation was created successfully."
              : "The escalation could not be created.",
          toolResult: result,
          tool: pending.toolName,
          toolsUsed: [pending.toolName],
        };
      } catch (error) {
        clearPendingConfirmation();
        return {
          type: "final" as const,
          answer: "The escalation could not be created.",
          toolResult: toolErrorResult(error),
          tool: pending.toolName,
          toolsUsed: [pending.toolName],
        };
      }
    }

    if (isRejection(request.question)) {
      clearPendingConfirmation();
      return {
        type: "final" as const,
        answer: "Okay. I won't create the escalation.",
        tool: null,
        toolsUsed: [],
      };
    }

    return {
      type: "confirmation_required" as const,
      tool: pending.toolName,
      arguments: pending.arguments,
      message:
        "Please explicitly confirm whether you want me to proceed with creating the escalation.",
      toolsUsed: [pending.toolName],
    };
  }

  const models = chatModels();
  let lastError: unknown;

  for (const model of models) {
    try {
      return await runAgentLoop(model, request);
    } catch (error) {
      lastError = error;
      if (!isRetryableModelError(error)) throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All free-tier Gemini models failed.");
}