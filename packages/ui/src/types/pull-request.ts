export type PRState = "OPEN" | "CLOSED" | "MERGED";

export type CIState = "SUCCESS" | "FAILURE" | "PENDING" | "NONE";

export type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED";

export type ReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING";

export type MergeableState = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";

export interface PRAuthor {
  login: string;
  avatarUrl: string;
}

export interface PRReviewer {
  login: string;
  avatarUrl: string;
  state: ReviewState;
}

export interface CICheck {
  name: string;
  status: "SUCCESS" | "FAILURE" | "PENDING";
  conclusion: string | null;
}

export interface PRLabel {
  name: string;
  color: string;
}

export interface NormalizedPR {
  // Identity
  id: string;
  number: number;
  title: string;
  url: string;
  repo: string;

  // State
  state: PRState;
  isDraft: boolean;

  // Author
  author: PRAuthor;

  // Code changes
  additions: number;
  deletions: number;
  changedFiles: number;

  // Reviews
  reviewDecision: ReviewDecision | null;
  reviewers: PRReviewer[];

  // CI
  ciState: CIState;
  ciChecks: CICheck[];

  // Merge
  mergeable: MergeableState;

  // Meta
  labels: PRLabel[];
  createdAt: string;
  updatedAt: string;
  isUnread: boolean;
}
