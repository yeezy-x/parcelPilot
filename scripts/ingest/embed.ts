import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const model = process.env.EMBEDDING_MODEL ?? "gemini-embedding-2-preview";
const dimensions = Number(process.env.EMBEDDING_DIMENSIONS ?? "768");
const ai = new GoogleGenAI({ apiKey });

export async function embedText(text: string): Promise<number[]> {
  const result = await ai.models.embedContent({
    model,
    contents: text,
    config: { outputDimensionality: dimensions },
  });

  const embedding = result.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error("Gemini returned no embedding.");
  }
  if (embedding.length !== dimensions) {
    throw new Error(`Embedding dimension mismatch: expected ${dimensions}, got ${embedding.length}`);
  }
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    embeddings.push(await embedText(text));
  }
  return embeddings;
}
