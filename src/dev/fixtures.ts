import { compile } from '../query/compile';
import { defaultSections } from '../query/defaults';

type RawNode = Record<string, unknown>;

const avatar = (login: string) => `https://avatars.githubusercontent.com/${login}`;

interface NodeOpts {
  number: number;
  title: string;
  repo: string;
  author: string;
  reviewDecision?: string | null;
  checks?: string | null;
  additions?: number;
  deletions?: number;
  isDraft?: boolean;
  labels?: Array<{ name: string; color: string }>;
  reviewers?: string[];
  daysAgo?: number;
}

function node(o: NodeOpts): RawNode {
  return {
    id: `PR_${o.number}`,
    number: o.number,
    title: o.title,
    url: `https://github.com/${o.repo}/pull/${o.number}`,
    isDraft: o.isDraft ?? false,
    updatedAt: new Date(Date.now() - (o.daysAgo ?? 0) * 86_400_000).toISOString(),
    additions: o.additions ?? 0,
    deletions: o.deletions ?? 0,
    mergeable: 'MERGEABLE',
    reviewDecision: o.reviewDecision ?? null,
    author: { login: o.author, avatarUrl: avatar(o.author) },
    repository: { nameWithOwner: o.repo },
    commits: { nodes: [{ commit: { statusCheckRollup: o.checks ? { state: o.checks } : null } }] },
    labels: { nodes: o.labels ?? [] },
    reviewRequests: {
      nodes: (o.reviewers ?? []).map((r) => ({ requestedReviewer: { login: r, avatarUrl: avatar(r) } })),
    },
    latestReviews: {
      nodes:
        o.reviewDecision === 'APPROVED'
          ? [{ author: { login: 'monalisa', avatarUrl: avatar('monalisa') }, state: 'APPROVED' }]
          : o.reviewDecision === 'CHANGES_REQUESTED'
            ? [{ author: { login: 'hubot', avatarUrl: avatar('hubot') }, state: 'CHANGES_REQUESTED' }]
            : [],
    },
  };
}

const sections = defaultSections();
const compiled = (id: string) => compile(sections.find((s) => s.id === id)!.query);

/** Raw GraphQL-shaped PR nodes keyed by the default sections' compiled queries. */
export const fixturesByQuery = new Map<string, RawNode[]>([
  [
    compiled('needs-your-review'),
    [
      node({ number: 4821, title: 'Add retry/backoff to the sync worker', repo: 'acme/api', author: 'devon', reviewDecision: 'REVIEW_REQUIRED', checks: 'SUCCESS', additions: 142, deletions: 18, reviewers: ['octocat'], labels: [{ name: 'backend', color: '0e8a16' }], daysAgo: 0 }),
      node({ number: 4819, title: 'Fix flaky notifications test', repo: 'acme/web', author: 'kai', reviewDecision: 'REVIEW_REQUIRED', checks: 'FAILURE', additions: 23, deletions: 9, reviewers: ['octocat'], daysAgo: 1 }),
      node({ number: 4810, title: 'Bump primer to v38', repo: 'acme/web', author: 'sam', reviewDecision: 'REVIEW_REQUIRED', checks: 'PENDING', additions: 1203, deletions: 980, reviewers: ['octocat', 'monalisa'], labels: [{ name: 'deps', color: 'fbca04' }], daysAgo: 2 }),
    ],
  ],
  [
    compiled('approved'),
    [
      node({ number: 4805, title: 'Cache rate-limit headers in the SW', repo: 'acme/api', author: 'octocat', reviewDecision: 'APPROVED', checks: 'SUCCESS', additions: 88, deletions: 4, daysAgo: 0 }),
      node({ number: 4790, title: 'Extract LGTM query compiler', repo: 'acme/web', author: 'octocat', reviewDecision: 'APPROVED', checks: 'SUCCESS', additions: 312, deletions: 40, labels: [{ name: 'lgtm', color: '5319e7' }], daysAgo: 3 }),
    ],
  ],
  [
    compiled('waiting-for-reviewers'),
    [
      node({ number: 4822, title: 'Device-flow auth provider', repo: 'acme/web', author: 'octocat', reviewDecision: 'REVIEW_REQUIRED', checks: 'SUCCESS', additions: 240, deletions: 12, reviewers: ['devon'], daysAgo: 0 }),
    ],
  ],
  [
    compiled('drafts'),
    [
      node({ number: 4830, title: 'WIP: shadow-DOM portal retargeting', repo: 'acme/web', author: 'octocat', isDraft: true, checks: 'PENDING', additions: 60, deletions: 2, daysAgo: 0 }),
    ],
  ],
  [
    compiled('waiting-for-author'),
    [
      node({ number: 4777, title: 'Refactor storage client', repo: 'acme/api', author: 'octocat', reviewDecision: 'CHANGES_REQUESTED', checks: 'SUCCESS', additions: 95, deletions: 110, daysAgo: 4 }),
    ],
  ],
  [
    compiled('recently-merged'),
    [
      node({ number: 4760, title: 'Initial WXT scaffold', repo: 'acme/web', author: 'octocat', checks: 'SUCCESS', additions: 420, deletions: 0, daysAgo: 6 }),
      node({ number: 4751, title: 'Add @ghpp/domain contract', repo: 'acme/web', author: 'octocat', checks: 'SUCCESS', additions: 180, deletions: 0, daysAgo: 7 }),
    ],
  ],
]);
