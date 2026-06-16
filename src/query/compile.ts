import type { FilterCondition, FilterQuery, MeOrLogin, RepoScope } from './model';

const meOrLogin = (v: MeOrLogin): string => (v.kind === 'me' ? '@me' : v.login);
const quoteIfNeeded = (value: string): string => (/\s/.test(value) ? `"${value}"` : value);

/** Map a single condition to its GitHub search qualifier token. */
export function conditionToken(c: FilterCondition): string {
  switch (c.field) {
    case 'prStatus':
      return `is:${c.value}`;
    case 'draft':
      return `draft:${c.value}`;
    case 'author':
      return `author:${meOrLogin(c.value)}`;
    case 'assignee':
      return `assignee:${meOrLogin(c.value)}`;
    case 'reviewRequested':
      return `review-requested:${meOrLogin(c.value)}`;
    case 'reviewedBy':
      return `reviewed-by:${meOrLogin(c.value)}`;
    case 'reviewStatus':
      return `review:${c.value}`;
    case 'label':
      return `${c.negate ? '-' : ''}label:${quoteIfNeeded(c.value)}`;
  }
}

const scopeTokens = (scope: RepoScope): string[] => [
  ...scope.orgs.map((o) => `org:${o}`),
  ...scope.repos.map((r) => `repo:${r}`),
];

/**
 * Compile a query to a single GitHub search string with AND semantics
 * (GitHub joins space-separated qualifiers with AND). Always prefixed `is:pr`.
 */
export function compile(query: FilterQuery): string {
  return ['is:pr', ...scopeTokens(query.scope), ...query.conditions.map(conditionToken)].join(' ');
}

/**
 * Compile to one or more search strings. AND (or <=1 condition) yields a single
 * string. GitHub has no general OR across qualifiers, so OR yields one search
 * per condition (scope applied to each) for the caller to union + de-dupe by id.
 */
export function compileToSearches(query: FilterQuery): string[] {
  if (query.combinator === 'AND' || query.conditions.length <= 1) {
    return [compile(query)];
  }
  const base = ['is:pr', ...scopeTokens(query.scope)];
  return query.conditions.map((c) => [...base, conditionToken(c)].join(' '));
}
