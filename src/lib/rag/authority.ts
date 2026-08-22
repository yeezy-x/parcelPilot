import type { AuthorityClass, RetrievalResult } from "./retrieval.types";

export function getAuthorityClass(result: RetrievalResult): AuthorityClass {
  const documentType = String(result.documentType).trim().toUpperCase();
  const authorityStatus = String(result.authorityStatus).trim().toUpperCase();

  console.log("[AUTHORITY]", {
    sourceFile: result.sourceFile,
    documentType,
    authorityStatus,
  });

  if (documentType === "AGREEMENT" && (authorityStatus === "CURRENT" || authorityStatus === "ACTIVE")) {
    return "ACCOUNT_AGREEMENT";
  }
  if (documentType === "POLICY" && authorityStatus === "CURRENT") {
    return "CURRENT_POLICY";
  }
  if (documentType === "SOP" && authorityStatus === "CURRENT") {
    return "CURRENT_SOP";
  }
  if (documentType === "PRODUCT_DOC" && authorityStatus === "CURRENT") {
    return "CURRENT_PRODUCT_DOC";
  }
  if (authorityStatus === "DEPRECATED" || authorityStatus === "HISTORICAL") {
    return "HISTORICAL";
  }
  return "UNKNOWN";
}

export function getAuthorityPriority(authorityClass: AuthorityClass): number {
  switch (authorityClass) {
    case "ACCOUNT_AGREEMENT": return 100;
    case "CURRENT_POLICY": return 80;
    case "CURRENT_SOP": return 75;
    case "CURRENT_PRODUCT_DOC": return 60;
    case "HISTORICAL": return 10;
    case "UNKNOWN": default: return 0;
  }
}
