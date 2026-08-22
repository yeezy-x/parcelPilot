import type { ContextSource } from "./context.types";

export function orderSupportingSources(
  sources: ContextSource[],
): ContextSource[] {
  return [...sources].sort(
    (a, b) => b.finalScore - a.finalScore,
  );
}