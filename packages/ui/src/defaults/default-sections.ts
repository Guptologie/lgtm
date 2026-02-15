import type { SectionConfig } from "../types";

const PR_FIELDS = `
  ... on PullRequest {
    id
    number
    title
    url
    repository { nameWithOwner }
    author { login avatarUrl }
    additions
    deletions
    changedFiles
    reviewDecision
    isDraft
    state
    mergeable
    createdAt
    updatedAt
    labels(first: 10) { nodes { name color } }
    reviews(last: 10) { nodes { author { login avatarUrl } state } }
    latestReviews(first: 10) { nodes { author { login avatarUrl } state } }
    commits(last: 1) {
      nodes {
        commit {
          statusCheckRollup {
            contexts(first: 50) {
              nodes {
                ... on CheckRun { name conclusion status }
                ... on StatusContext { context state }
              }
            }
          }
        }
      }
    }
  }
`;

function buildQuery(searchQuery: string): string {
  return `query {
  search(query: "${searchQuery}", type: ISSUE, first: 25) {
    issueCount
    edges {
      node {
        ${PR_FIELDS}
      }
    }
  }
}`;
}

export const defaultSections: SectionConfig[] = [
  {
    id: "needs-your-review",
    title: "Needs your review",
    query: buildQuery(
      "is:pr is:open review-requested:{currentUser} archived:false",
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 0,
  },
  {
    id: "returned-to-you",
    title: "Returned to you",
    query: buildQuery(
      "is:pr is:open author:{currentUser} review:approved archived:false",
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 1,
  },
  {
    id: "approved",
    title: "Approved",
    query: buildQuery(
      "is:pr is:open author:{currentUser} review:approved archived:false",
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 2,
  },
  {
    id: "waiting-for-reviewers",
    title: "Waiting for reviewers",
    query: buildQuery(
      "is:pr is:open author:{currentUser} review:required archived:false",
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 3,
  },
  {
    id: "drafts",
    title: "Drafts",
    query: buildQuery(
      "is:pr is:open author:{currentUser} draft:true archived:false",
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: true,
    order: 4,
  },
  {
    id: "waiting-for-author",
    title: "Waiting for author",
    query: buildQuery(
      "is:pr is:open review-requested:{currentUser} review:changes_requested archived:false",
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: true,
    order: 5,
  },
  {
    id: "recently-merged",
    title: "Recently merged",
    query: buildQuery(
      "is:pr is:merged author:{currentUser} archived:false sort:updated-desc",
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: true,
    order: 6,
  },
];
