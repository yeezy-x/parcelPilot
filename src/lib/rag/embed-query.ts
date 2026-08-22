const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text";
const EXPECTED_DIMENSIONS = 768;

export async function embedQuery(query: string): Promise<number[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("Cannot embed an empty query.");
  }
  const response = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: normalizedQuery,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama query embedding failed: ${response.status} ${response.statusText}\n${body}`);
  }
  const data = await response.json();
  const embedding = data.embeddings?.[0];
  if (!Array.isArray(embedding)) {
    throw new Error("Ollama did not return a valid query embedding.");
  }
  if (embedding.length !== EXPECTED_DIMENSIONS) {
    throw new Error(`Invalid query embedding dimension. Expected ${EXPECTED_DIMENSIONS}, received ${embedding.length}.`);
  }
  return embedding;
}
