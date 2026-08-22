
export type RetrievalOptions = {
    topK?: number;
    accountId?: string;
    documentId?: string;
    minSimilarity?: number;
};
  
export type RetrievalResult = {
    chunkId: string;
    documentId: string;
    sourceFile: string;
    chunkIndex: number;
    chunkText: string;
    pageStart: number | null;
    pageEnd: number | null;
    documentType: string;
    authorityStatus: string;  
    similarity: number;
};

export type AuthorityClass =
  | "ACCOUNT_AGREEMENT"
  | "CURRENT_POLICY"
  | "CURRENT_SOP"
  | "CURRENT_PRODUCT_DOC"
  | "HISTORICAL"
  | "UNKNOWN";

export type RankedRetrievalResult =
  RetrievalResult & {
    authorityClass: AuthorityClass;
    authorityPriority: number;
    finalScore: number;
  };