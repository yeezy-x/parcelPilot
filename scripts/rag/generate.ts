import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({ apiKey });
const model = process.env.LLM_MODEL ?? "gemini-2.5-flash";

export type GenerateAnswerInput = {
  question: string;
  context: string;
};

export type GenerateAnswerResult = {
  answer: string;
};

const SYSTEM_INSTRUCTION = `
You are ParcelPilot's support AI assistant.
Answer the user's question using ONLY the supplied context.
Rules:
1. Do not invent facts.
2. Do not use outside knowledge.
3. If the context does not contain enough information, clearly say that the information is insufficient.
4. Respect document authority.
5. Account-specific agreements override general policy when an account is explicitly provided.
6. Do not use deprecated or historical information as the current answer when a current authoritative source is available.
7. Give a concise, direct answer.
8. When useful, mention the source document supporting the answer.
`;

export async function generateAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerResult> {
  const prompt = `
    ${SYSTEM_INSTRUCTION}
    === CONTEXT ===
    ${input.context}
    === USER QUESTION ===
    ${input.question}
    === ANSWER ===
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const answer = response.text?.trim();
  if (!answer) {
    throw new Error("Gemini returned an empty answer.");
  }
  return { answer };
}
