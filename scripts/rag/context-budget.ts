import type { ContextSource } from "./context.types";

export type ContextBudget = {
  maxSupportingSources: number;
};

export const DEFAULT_CONTEXT_BUDGET: ContextBudget = {
  maxSupportingSources: 4,
};

export function applyContextBudget(
  supporting: ContextSource[],
  budget: ContextBudget = DEFAULT_CONTEXT_BUDGET,
): ContextSource[] {
  return supporting.slice(
    0,
    budget.maxSupportingSources,
  );
}