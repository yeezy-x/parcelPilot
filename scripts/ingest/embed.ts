const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ??"nomic-embed-text";
const EXPECTED_DIMENSIONS = 768;

type OllamaEmbedResponse = {
  model: string;
  embeddings: number[][];
};

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await fetch(`${OLLAMA_URL}/api/embed`,
    {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama embedding request failed: ${response.status} ${response.statusText}\n${body}`);
  }
  const data = (await response.json()) as OllamaEmbedResponse;

  if (!Array.isArray(data.embeddings) || data.embeddings.length !== texts.length
  ) {
    throw new Error(`Ollama returned ${data.embeddings?.length ?? 0} embeddings for ${texts.length} inputs.`);
  }

  for (const [index, embedding] of data.embeddings.entries()) {
    if (!Array.isArray(embedding) || embedding.length !== EXPECTED_DIMENSIONS) {
      throw new Error(`Invalid embedding dimension at index ${index}. Expected ${EXPECTED_DIMENSIONS}, received ${embedding?.length ?? 0}.`);
    }
  }
  return data.embeddings;
}

export function getEmbeddingModel(): string {
  return EMBEDDING_MODEL;
}

export function getEmbeddingDimensions(): number {
  return EXPECTED_DIMENSIONS;
}