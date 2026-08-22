import "dotenv/config";
import { DOCUMENTS, getPdfPath } from "./documents";
import { extractPdfText } from "./pdf";
import { chunkPages } from "./chunk";
import { embedTexts } from "./embed";
import { prisma } from "@/lib/db/prisma";

export async function ingestDocuments() {
  let documentsProcessed = 0;
  let chunksProcessed = 0;
  for (const metadata of DOCUMENTS) {
    console.log(`\nProcessing ${metadata.sourceFile}`);
    const document = await prisma.document.findUnique({
      where: { sourceFile: metadata.sourceFile },
    });
    if (!document) {
      throw new Error(`Document record not found: ${metadata.sourceFile}`);
    }
    try {
        await prisma.document.update({
            where: { id: document.id },
            data: { processingStatus: "PROCESSING" },
        });
      const pdfPath = getPdfPath(metadata.sourceFile);
      const pages = await extractPdfText(pdfPath);
      if (pages.length === 0) {
        throw new Error("PDF contains no extractable text.");
      }
      console.log(`Pages: ${pages.length}`);
      const chunks = await chunkPages(pages);
      console.log(
        `  Pages extracted: ${pages.length}`,
    );
    
    console.log(
        `  Chunks generated: ${chunks.length}`,
    );
    
    for (const chunk of chunks) {
        console.log(
            `    Chunk ${chunk.chunkIndex} | page ${chunk.pageStart}-${chunk.pageEnd} | ${chunk.tokenCount} tokens`,
        );
    }      
      if (chunks.length === 0) {
        throw new Error("No chunks generated from PDF.");
      }
      console.log(`Chunks: ${chunks.length}`);
      const embeddings = await embedTexts(chunks.map((chunk) => chunk.text));
      if (embeddings.length !== chunks.length) {
        throw new Error(`Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks.`);
      }
      await prisma.documentChunk.deleteMany({
        where: { documentId: document.id },
      });
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const vector = `[${embedding.join(",")}]`;
        await prisma.$executeRaw`
          INSERT INTO "document_chunks" (
            "id",
            "document_id",
            "chunk_index",
            "chunk_text",
            "page_start",
            "page_end",
            "embedding",
            "created_at"
          )
          VALUES (
            gen_random_uuid(),
            ${document.id}::uuid,
            ${chunk.chunkIndex},
            ${chunk.text},
            ${chunk.pageStart},
            ${chunk.pageEnd},
            ${vector}::vector,
            NOW()
          )
        `;
      }
      await prisma.document.update({
        where: { id: document.id },
        data: { processingStatus: "COMPLETED" },
      });
      documentsProcessed++;
      chunksProcessed += chunks.length;
      console.log(`${metadata.sourceFile} completed`);
    } catch (error) {
      await prisma.document.update({
        where: { id: document.id },
        data: { processingStatus: "FAILED" },
      });
      throw error;
    }
  }
  return { documentsProcessed, chunksProcessed };
}
