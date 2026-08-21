import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateWithOllama } from "@/lib/ai/ollama";

const chatSchema = z.object({
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }
    const answer = await generateWithOllama([
      {
        role: "system",
        content: "You are ParcelPilot, a helpful logistics customer support assistant.",
      },
      {
        role: "user",
        content: parsed.data.message,
      },
    ]);
    return NextResponse.json({answer});
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}