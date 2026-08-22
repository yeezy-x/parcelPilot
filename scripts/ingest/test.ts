import "dotenv/config";

import {
  embedTexts,
  getEmbeddingModel,
  getEmbeddingDimensions,
} from "./embed";

async function main() {
  const texts = [
    "ParcelPilot support policy",
    "P1 incidents must be escalated immediately.",
    "A signed customer agreement may override default support policy.",
  ];

  console.log(
    `Embedding model: ${getEmbeddingModel()}`,
  );

  console.log(
    `Expected dimensions: ${getEmbeddingDimensions()}`,
  );

  console.log(
    `Embedding ${texts.length} texts...`,
  );

  const embeddings =
    await embedTexts(texts);

  console.log(
    `Received ${embeddings.length} embeddings.`,
  );

  embeddings.forEach(
    (embedding, index) => {
      console.log(
        `Embedding ${index}: ${embedding.length} dimensions`,
      );

      console.log(
        "First 5 values:",
        embedding.slice(0, 5),
      );
    },
  );
}

main().catch((error) => {
  console.error(
    "Embedding test failed:",
  );

  console.error(error);

  process.exit(1);
});