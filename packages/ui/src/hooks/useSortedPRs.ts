import { useMemo } from "react";
import type { NormalizedPR, SortConfig, CIState } from "../types";

const ciStateOrder: Record<CIState, number> = {
  FAILURE: 0,
  PENDING: 1,
  SUCCESS: 2,
  NONE: 3,
};

const reviewStateOrder: Record<string, number> = {
  CHANGES_REQUESTED: 0,
  REVIEW_REQUIRED: 1,
  APPROVED: 2,
};

function comparePRs(a: NormalizedPR, b: NormalizedPR, field: string): number {
  switch (field) {
    case "updated":
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    case "created":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "lines":
      return a.additions + a.deletions - (b.additions + b.deletions);
    case "reviewState": {
      const aOrder = a.reviewDecision
        ? (reviewStateOrder[a.reviewDecision] ?? 3)
        : 3;
      const bOrder = b.reviewDecision
        ? (reviewStateOrder[b.reviewDecision] ?? 3)
        : 3;
      return aOrder - bOrder;
    }
    case "ciState":
      return ciStateOrder[a.ciState] - ciStateOrder[b.ciState];
    default:
      return 0;
  }
}

export function useSortedPRs(
  prs: NormalizedPR[],
  sort: SortConfig
): NormalizedPR[] {
  return useMemo(() => {
    const sorted = [...prs].sort((a, b) => comparePRs(a, b, sort.field));
    if (sort.direction === "desc") {
      sorted.reverse();
    }
    return sorted;
  }, [prs, sort.field, sort.direction]);
}
