import * as react_jsx_runtime from 'react/jsx-runtime';

type SortField = "updated" | "created" | "lines" | "reviewState" | "ciState";
interface SortConfig {
    field: SortField;
    direction: "asc" | "desc";
}
interface SectionConfig {
    id: string;
    title: string;
    query: string;
    sort: SortConfig;
    collapsed: boolean;
    order: number;
}

interface SerializedDashboard {
    version: number;
    sections: SectionConfig[];
    settings: DashboardSettings;
}
interface DashboardSettings {
    theme: "light" | "dark" | "auto";
}

interface StorageAdapter {
    load(): Promise<SerializedDashboard | null>;
    save(dashboard: SerializedDashboard): Promise<void>;
    onChange(callback: (dashboard: SerializedDashboard) => void): () => void;
}
interface AuthAdapter {
    getToken(): Promise<string | null>;
    setToken(token: string): Promise<void>;
    clearToken(): Promise<void>;
    onTokenChange(callback: (token: string | null) => void): () => void;
}

type PRState = "OPEN" | "CLOSED" | "MERGED";
type CIState = "SUCCESS" | "FAILURE" | "PENDING" | "NONE";
type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED";
type ReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING";
type MergeableState = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";
interface PRAuthor {
    login: string;
    avatarUrl: string;
}
interface PRReviewer {
    login: string;
    avatarUrl: string;
    state: ReviewState;
}
interface CICheck {
    name: string;
    status: "SUCCESS" | "FAILURE" | "PENDING";
    conclusion: string | null;
}
interface PRLabel {
    name: string;
    color: string;
}
interface NormalizedPR {
    id: string;
    number: number;
    title: string;
    url: string;
    repo: string;
    state: PRState;
    isDraft: boolean;
    author: PRAuthor;
    additions: number;
    deletions: number;
    changedFiles: number;
    reviewDecision: ReviewDecision | null;
    reviewers: PRReviewer[];
    ciState: CIState;
    ciChecks: CICheck[];
    mergeable: MergeableState;
    labels: PRLabel[];
    createdAt: string;
    updatedAt: string;
    isUnread: boolean;
}

interface LGTMProps {
    adapters: {
        storage: StorageAdapter;
        auth: AuthAdapter;
    };
    currentUser: string;
    onError?: (error: Error) => void;
}
declare function LGTM({ adapters, currentUser, onError }: LGTMProps): react_jsx_runtime.JSX.Element;

declare const defaultSections: SectionConfig[];

export { type AuthAdapter, type CICheck, type CIState, type DashboardSettings, LGTM, type LGTMProps, type NormalizedPR, type PRAuthor, type PRLabel, type ReviewDecision, type ReviewState, type PRReviewer as Reviewer, type SectionConfig, type SerializedDashboard, type SortConfig, type SortField, type StorageAdapter, defaultSections };
