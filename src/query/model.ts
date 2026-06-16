export type Combinator = 'AND' | 'OR';

export type PrStatus = 'open' | 'closed' | 'merged';
export type ReviewStatus = 'required' | 'approved' | 'changes_requested' | 'none';

/** A value that is either the current user (@me) or a specific login. */
export type MeOrLogin = { kind: 'me' } | { kind: 'login'; login: string };

/** One filter condition. Each field implies its GitHub search qualifier. */
export type FilterCondition =
  | { id: string; field: 'prStatus'; value: PrStatus }
  | { id: string; field: 'draft'; value: boolean }
  | { id: string; field: 'author'; value: MeOrLogin }
  | { id: string; field: 'assignee'; value: MeOrLogin }
  | { id: string; field: 'reviewRequested'; value: MeOrLogin }
  | { id: string; field: 'reviewedBy'; value: MeOrLogin }
  | { id: string; field: 'reviewStatus'; value: ReviewStatus }
  | { id: string; field: 'label'; value: string; negate?: boolean };

export type ConditionField = FilterCondition['field'];

/** Repository scope, separate from conditions (mirrors the editor's repo picker). */
export interface RepoScope {
  orgs: string[];
  repos: string[];
}

export interface FilterQuery {
  combinator: Combinator;
  conditions: FilterCondition[];
  scope: RepoScope;
}

/** A persisted inbox section: a named, ordered, query-backed group. */
export interface SectionConfig {
  id: string;
  name: string;
  query: FilterQuery;
  collapsed: boolean;
  /** Whether to show a PR count badge for this section (sidebar + header). */
  badgeCount: boolean;
}
