import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAgent } from "@/lib/agent/agent";
import {setPendingConfirmation,getPendingConfirmation,type PendingConfirmation} from "@/lib/agent/confirmation";

const chatSchema = z.object({
  message: z.string().min(1),
  accountId: z.enum(["ACCT-001", "ACCT-002"]),
  pendingConfirmation: z
    .object({
      toolName: z.literal("createEscalation"),
      arguments: z.record(z.string(), z.unknown()),
    })
    .nullable()
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = chatSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { message, accountId, pendingConfirmation } = parsed.data;
    if (pendingConfirmation) {
      setPendingConfirmation(pendingConfirmation as PendingConfirmation);
    }
    const result = await runAgent({ question: message, accountId });
    const pending =
      result.type === "confirmation_required"
        ? {
            toolName: "createEscalation" as const,
            arguments: result.arguments,
          }
        : getPendingConfirmation();
    return NextResponse.json({
      type: result.type,
      answer: result.type === "final" ? result.answer : result.message,
      tool: result.tool ?? result.toolsUsed[0] ?? null,
      toolsUsed: result.toolsUsed ?? [],
      pendingConfirmation: pending ?? null,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}