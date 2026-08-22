import type {
    AuthorityClass,
  } from "../../src/lib/rag/retrieval.types";
  
  export type ContextSource = {
    chunkId: string;
    documentId: string;
    sourceFile: string;
    chunkIndex: number;
    pageStart: number;
    pageEnd: number;
    documentType: string;
    authorityStatus: string;
    authorityClass: AuthorityClass;
    similarity: number;
    finalScore: number;
    text: string;
  };
  
  export type RagContext = {
    query: string;
    accountId: string | null;  
    primary: ContextSource;
    supporting: ContextSource[];
  };