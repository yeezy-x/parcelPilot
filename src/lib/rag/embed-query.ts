import { embedText } from "../../../scripts/ingest/embed";

export async function embedQuery(
  query: string,
): Promise<number[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    throw new Error("Cannot embed an empty query.");
  }
  const embedding = await embedText(normalizedQuery);
  const expectedDimensions = Number(
    process.env.EMBEDDING_DIMENSIONS ?? "768",
  );
  if (embedding.length !== expectedDimensions) {
    throw new Error(
      `Invalid query embedding dimension. Expected ${expectedDimensions}, received ${embedding.length}.`,
    );
  }
  return embedding;
}