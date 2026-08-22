import { RecursiveChunker } from "@chonkiejs/core";
import { PdfPage } from "./pdf";

export type TextChunk = {
  chunkIndex: number;
  text: string;
  tokenCount: number;
  pageStart: number;
  pageEnd: number;
};

let chunker: RecursiveChunker | null = null;
async function getChunker() {
  if (!chunker) {
    chunker = await RecursiveChunker.create({
        tokenizer:"Xenova/gpt2",
        chunkSize: 250,
        minCharactersPerChunk: 100,
    });
  }
  return chunker;
}

export async function chunkPages(pages: PdfPage[]): Promise<TextChunk[]> {
    const chunker = await getChunker();
    const chunks: TextChunk[] = [];
    for (const page of pages) {
      const pageChunks = await chunker.chunk(page.text);
      for (const chunk of pageChunks) {
        if (!chunk.text.trim()) continue
        chunks.push({
          chunkIndex: chunks.length,
          text: chunk.text.trim(),
          tokenCount: chunk.tokenCount,  
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
        });
      }
    }
    return chunks;
}