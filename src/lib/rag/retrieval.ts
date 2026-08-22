import { prisma } from "@/lib/db/prisma";
import { RetrievalOptions, RetrievalResult } from "./retrieval.types";
import { embedQuery } from "./embed-query";

export async function retrieveChunks(query: string, options: RetrievalOptions = {}): Promise<RetrievalResult[]> {
  const topK = Math.min(Math.max(options.topK ?? 5, 1), 20);
  const queryEmbedding = await embedQuery(query);
  const vector = `[${queryEmbedding.join(",")}]`;
  const minSimilarity = options.minSimilarity ?? 0;
  let results: RetrievalResult[];

  if (options.accountId) {
    results = await prisma.$queryRaw<RetrievalResult[]>`
      SELECT
        dc.id AS "chunkId",
        dc.document_id AS "documentId",
        d.source_file AS "sourceFile",
        dc.chunk_index AS "chunkIndex",
        dc.chunk_text AS "chunkText",
        dc.page_start AS "pageStart",
        dc.page_end AS "pageEnd",
        d.doc_type::text AS "documentType",
        d.authority_status::text AS "authorityStatus",
        1 - (dc.embedding <=> ${vector}::vector) AS "similarity"
      FROM document_chunks dc
      INNER JOIN documents d ON d.id = dc.document_id
      WHERE dc.embedding IS NOT NULL
        AND (d.account_id IS NULL OR d.account_id = ${options.accountId})
        AND (1 - (dc.embedding <=> ${vector}::vector)) >= ${minSimilarity}
      ORDER BY dc.embedding <=> ${vector}::vector
      LIMIT ${topK}
    `;
  } else if (options.documentId) {
    results = await prisma.$queryRaw<RetrievalResult[]>`
      SELECT
        dc.id AS "chunkId",
        dc.document_id AS "documentId",
        d.source_file AS "sourceFile",
        dc.chunk_index AS "chunkIndex",
        dc.chunk_text AS "chunkText",
        dc.page_start AS "pageStart",
        dc.page_end AS "pageEnd",
        d.doc_type::text AS "documentType",
        d.authority_status::text AS "authorityStatus",
        1 - (dc.embedding <=> ${vector}::vector) AS "similarity"
      FROM document_chunks dc
      INNER JOIN documents d ON d.id = dc.document_id
      WHERE dc.embedding IS NOT NULL
        AND dc.document_id = ${options.documentId}
        AND (1 - (dc.embedding <=> ${vector}::vector)) >= ${minSimilarity}
      ORDER BY dc.embedding <=> ${vector}::vector
      LIMIT ${topK}
    `;
  } else {
    results = await prisma.$queryRaw<RetrievalResult[]>`
      SELECT
        dc.id AS "chunkId",
        dc.document_id AS "documentId",
        d.source_file AS "sourceFile",
        dc.chunk_index AS "chunkIndex",
        dc.chunk_text AS "chunkText",
        dc.page_start AS "pageStart",
        dc.page_end AS "pageEnd",
        d.doc_type::text AS "documentType",
        d.authority_status::text AS "authorityStatus",
        1 - (dc.embedding <=> ${vector}::vector) AS "similarity"
      FROM document_chunks dc
      INNER JOIN documents d ON d.id = dc.document_id
      WHERE dc.embedding IS NOT NULL
        AND (1 - (dc.embedding <=> ${vector}::vector)) >= ${minSimilarity}
      ORDER BY dc.embedding <=> ${vector}::vector
      LIMIT ${topK}
    `;
  }

  return results;
}
