import type { ContextSource, RagContext } from "./context.types";

function formatSourceHeader(source: ContextSource): string {
  return [
    `Source: ${source.sourceFile}`,
    `Document Type: ${source.documentType}`,
    `Authority: ${source.authorityClass}`,
    `Pages: ${source.pageStart}-${source.pageEnd}`,
    `Chunk: ${source.chunkIndex}`,
  ].join("\n");
}

function formatPrimarySource(source: ContextSource): string {
  return [
    "=== PRIMARY EVIDENCE ===",
    formatSourceHeader(source),
    "",
    "Evidence:",
    source.text,
  ].join("\n");
}

function formatSupportingSource(source: ContextSource, index: number): string {
  return [
    `=== SUPPORTING EVIDENCE ${index} ===`,
    formatSourceHeader(source),
    "",
    "Evidence:",
    source.text,
  ].join("\n");
}

export function formatRagContext(context: RagContext): string {
  const sections: string[] = [];

  sections.push("=== USER QUESTION ===", context.query);
  sections.push("", "=== ACCOUNT CONTEXT ===", context.accountId ?? "GLOBAL");
  sections.push("", formatPrimarySource(context.primary));

  if (context.supporting.length > 0) {
    sections.push(
      "",
      context.supporting
        .map((source, index) => formatSupportingSource(source, index + 1))
        .join("\n\n"),
    );
  }

  return sections.join("\n");
}
