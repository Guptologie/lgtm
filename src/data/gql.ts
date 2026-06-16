import type { SectionConfig } from '../query/model';
import { compile } from '../query/compile';

export type CheckState = 'SUCCESS' | 'PENDING' | 'FAILURE' | 'ERROR' | 'EXPECTED' | null;
export type ReviewDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | null;

export interface PrCardData {
  id: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  updatedAt: string;
  additions: number;
  deletions: number;
  mergeable: string;
  reviewDecision: ReviewDecision;
  checks: CheckState;
  author: { login: string; avatarUrl: string } | null;
  repository: { nameWithOwner: string };
  labels: Array<{ name: string; color: string }>;
  reviewers: Array<{ login: string; avatarUrl: string }>;
  latestReviews: Array<{ login: string; state: string }>;
}

const PR_CARD_FRAGMENT = `
fragment PrCard on PullRequest {
  id
  number
  title
  url
  isDraft
  updatedAt
  additions
  deletions
  mergeable
  reviewDecision
  author { login avatarUrl }
  repository { nameWithOwner }
  commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
  labels(first: 10) { nodes { name color } }
  reviewRequests(first: 10) { nodes { requestedReviewer { ... on User { login avatarUrl } } } }
  latestReviews(first: 10) { nodes { author { login avatarUrl } state } }
}`;

export interface CountsQuery {
  query: string;
  variables: Record<string, string>;
  /** alias (e.g. "s0") -> section id */
  aliasToId: Record<string, string>;
}

/**
 * Build a single GraphQL request aliasing an issueCount search per section that
 * shows a badge. OR sections are skipped (no single-search count) — see
 * compileToSearches.
 */
export function buildCountsQuery(sections: SectionConfig[]): CountsQuery | null {
  const eligible = sections.filter((s) => s.badgeCount && s.query.combinator === 'AND');
  if (eligible.length === 0) return null;

  const variables: Record<string, string> = {};
  const aliasToId: Record<string, string> = {};
  const params: string[] = [];
  const fields: string[] = [];

  eligible.forEach((s, i) => {
    variables[`q${i}`] = compile(s.query);
    aliasToId[`s${i}`] = s.id;
    params.push(`$q${i}: String!`);
    fields.push(`  s${i}: search(query: $q${i}, type: ISSUE, first: 0) { issueCount }`);
  });

  return {
    query: `query Counts(${params.join(', ')}) {\n${fields.join('\n')}\n}`,
    variables,
    aliasToId,
  };
}

export const CARDS_QUERY = `query Cards($q: String!, $first: Int!, $after: String) {
  search(query: $q, type: ISSUE, first: $first, after: $after) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes { ...PrCard }
  }
}
${PR_CARD_FRAGMENT}`;

export interface CardsResult {
  issueCount: number;
  nodes: PrCardData[];
  hasNextPage: boolean;
  endCursor: string | null;
}

// Loose shapes for parsing GraphQL responses.
type AnyRec = Record<string, unknown>;
const rec = (v: unknown): AnyRec => (typeof v === 'object' && v !== null ? (v as AnyRec) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

export function parseCounts(
  data: Record<string, { issueCount?: number } | null> | null | undefined,
  aliasToId: Record<string, string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [alias, id] of Object.entries(aliasToId)) {
    const node = data?.[alias];
    if (node && typeof node.issueCount === 'number') out[id] = node.issueCount;
  }
  return out;
}

export function parseCards(search: unknown): CardsResult {
  const s = rec(search);
  const nodes = arr(s.nodes)
    .map(rec)
    .filter((n) => n.id !== undefined)
    .map(toCard);
  const pageInfo = rec(s.pageInfo);
  return {
    issueCount: num(s.issueCount),
    nodes,
    hasNextPage: pageInfo.hasNextPage === true,
    endCursor: typeof pageInfo.endCursor === 'string' ? pageInfo.endCursor : null,
  };
}

function toCard(n: AnyRec): PrCardData {
  const author = n.author ? rec(n.author) : null;
  const repo = rec(n.repository);
  const checks =
    rec(arr(rec(n.commits).nodes)[0]) // first commit node
      .commit;
  const rollupState = rec(rec(checks).statusCheckRollup).state;
  return {
    id: str(n.id),
    number: num(n.number),
    title: str(n.title),
    url: str(n.url),
    isDraft: n.isDraft === true,
    updatedAt: str(n.updatedAt),
    additions: num(n.additions),
    deletions: num(n.deletions),
    mergeable: str(n.mergeable),
    reviewDecision: (n.reviewDecision as PrCardData['reviewDecision']) ?? null,
    checks: (typeof rollupState === 'string' ? rollupState : null) as CheckState,
    author: author ? { login: str(author.login), avatarUrl: str(author.avatarUrl) } : null,
    repository: { nameWithOwner: str(repo.nameWithOwner) },
    labels: arr(rec(n.labels).nodes).map(rec).map((l) => ({ name: str(l.name), color: str(l.color) })),
    reviewers: arr(rec(n.reviewRequests).nodes)
      .map(rec)
      .map((r) => rec(r.requestedReviewer))
      .filter((u) => u.login !== undefined)
      .map((u) => ({ login: str(u.login), avatarUrl: str(u.avatarUrl) })),
    latestReviews: arr(rec(n.latestReviews).nodes)
      .map(rec)
      .map((r) => ({ login: str(rec(r.author).login), state: str(r.state) })),
  };
}
