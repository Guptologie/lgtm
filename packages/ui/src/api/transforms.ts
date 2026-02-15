import type { NormalizedPR, CIState, CICheck, PRReviewer } from "../types/pull-request";

function computeCIState(contexts: Array<{ state?: string; conclusion?: string | null; status?: string }>): CIState {
  if (contexts.length === 0) return "NONE";

  let hasPending = false;

  for (const ctx of contexts) {
    const conclusion = ctx.conclusion?.toUpperCase();
    const state = ctx.state?.toUpperCase() ?? ctx.status?.toUpperCase();

    if (conclusion === "FAILURE" || conclusion === "ERROR" || state === "FAILURE" || state === "ERROR") {
      return "FAILURE";
    }

    if (state === "PENDING" || state === "QUEUED" || state === "IN_PROGRESS" || conclusion === null) {
      hasPending = true;
    }
  }

  if (hasPending) return "PENDING";
  return "SUCCESS";
}

function extractRepo(url: string): string {
  // Extract "owner/repo" from a GitHub PR URL like https://github.com/owner/repo/pull/123
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1] : "";
}

function normalizePR(node: any): NormalizedPR {
  const reviewNodes: any[] = node.reviews?.nodes ?? [];
  const reviewerMap = new Map<string, PRReviewer>();
  for (const review of reviewNodes) {
    if (!review.author?.login) continue;
    // Keep the latest review state per reviewer
    reviewerMap.set(review.author.login, {
      login: review.author.login,
      avatarUrl: review.author.avatarUrl ?? "",
      state: review.state ?? "COMMENTED",
    });
  }

  const ciContexts: any[] = node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.contexts?.nodes ?? [];
  const ciChecks: CICheck[] = ciContexts.map((ctx: any) => ({
    name: ctx.name ?? ctx.context ?? "unknown",
    status: (ctx.conclusion ?? ctx.state ?? "PENDING").toUpperCase() as CICheck["status"],
    conclusion: ctx.conclusion ?? null,
  }));

  const ciState = computeCIState(ciContexts);

  const labels: Array<{ name: string; color: string }> = (node.labels?.nodes ?? []).map((l: any) => ({
    name: l.name ?? "",
    color: l.color ?? "",
  }));

  return {
    id: node.id ?? "",
    number: node.number ?? 0,
    title: node.title ?? "",
    url: node.url ?? "",
    repo: node.repository?.nameWithOwner ?? extractRepo(node.url ?? ""),

    state: node.state ?? "OPEN",
    isDraft: node.isDraft ?? false,

    author: {
      login: node.author?.login ?? "",
      avatarUrl: node.author?.avatarUrl ?? "",
    },

    additions: node.additions ?? 0,
    deletions: node.deletions ?? 0,
    changedFiles: node.changedFiles ?? 0,

    reviewDecision: node.reviewDecision ?? null,
    reviewers: Array.from(reviewerMap.values()),

    ciState,
    ciChecks,

    mergeable: node.mergeable ?? "UNKNOWN",

    labels,
    createdAt: node.createdAt ?? "",
    updatedAt: node.updatedAt ?? "",
    isUnread: false,
  };
}

export function transformResponse(data: any): NormalizedPR[] {
  if (!data?.search) return [];

  // Support both edges[].node and nodes[] response shapes
  const edges: any[] = data.search.edges ?? [];
  const nodes: any[] = data.search.nodes ?? [];

  const prNodes = edges.length > 0 ? edges.map((e: any) => e.node) : nodes;

  return prNodes.filter(Boolean).map(normalizePR);
}
