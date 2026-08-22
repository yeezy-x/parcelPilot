export type QueryIntent = "CURRENT" | "HISTORICAL" | "GENERAL";

export function detectQueryIntent(query: string): QueryIntent {
  const normalized = query.toLowerCase().trim();

  const historicalPatterns = [
    "historical", "history", "previous", "old policy", "old version",
    "deprecated", "what was", "used to be", "in 2025", "in 2024", "previously"
  ];

  if (historicalPatterns.some((pattern) => normalized.includes(pattern))) {
    return "HISTORICAL";
  }

  return "CURRENT";
}
