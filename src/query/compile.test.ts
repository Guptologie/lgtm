import { describe, expect, it } from 'vitest';
import { compile, compileToSearches } from './compile';
import { defaultSections } from './defaults';
import type { FilterQuery } from './model';

const q = (partial: Partial<FilterQuery> & Pick<FilterQuery, 'conditions'>): FilterQuery => ({
  combinator: 'AND',
  scope: { orgs: [], repos: [] },
  ...partial,
});

describe('compile', () => {
  it('prefixes is:pr and joins AND conditions with spaces', () => {
    expect(
      compile(
        q({
          conditions: [
            { id: '1', field: 'prStatus', value: 'open' },
            { id: '2', field: 'reviewRequested', value: { kind: 'me' } },
            { id: '3', field: 'reviewStatus', value: 'required' },
          ],
        }),
      ),
    ).toBe('is:pr is:open review-requested:@me review:required');
  });

  it('maps each field to the right qualifier', () => {
    expect(compile(q({ conditions: [{ id: '1', field: 'author', value: { kind: 'login', login: 'octocat' } }] }))).toBe(
      'is:pr author:octocat',
    );
    expect(compile(q({ conditions: [{ id: '1', field: 'draft', value: true }] }))).toBe('is:pr draft:true');
    expect(compile(q({ conditions: [{ id: '1', field: 'assignee', value: { kind: 'me' } }] }))).toBe('is:pr assignee:@me');
    expect(compile(q({ conditions: [{ id: '1', field: 'reviewedBy', value: { kind: 'me' } }] }))).toBe(
      'is:pr reviewed-by:@me',
    );
  });

  it('quotes labels with spaces and supports negation', () => {
    expect(compile(q({ conditions: [{ id: '1', field: 'label', value: 'good first issue' }] }))).toBe(
      'is:pr label:"good first issue"',
    );
    expect(compile(q({ conditions: [{ id: '1', field: 'label', value: 'bug', negate: true }] }))).toBe('is:pr -label:bug');
  });

  it('includes org and repo scope tokens before conditions', () => {
    expect(
      compile(q({ scope: { orgs: ['acme'], repos: ['a/b'] }, conditions: [{ id: '1', field: 'prStatus', value: 'open' }] })),
    ).toBe('is:pr org:acme repo:a/b is:open');
  });
});

describe('compileToSearches', () => {
  it('returns a single string for AND', () => {
    expect(
      compileToSearches(
        q({
          conditions: [
            { id: '1', field: 'prStatus', value: 'open' },
            { id: '2', field: 'author', value: { kind: 'me' } },
          ],
        }),
      ),
    ).toEqual(['is:pr is:open author:@me']);
  });

  it('fans OR out into one search per condition, scope applied to each', () => {
    expect(
      compileToSearches({
        combinator: 'OR',
        scope: { orgs: ['acme'], repos: [] },
        conditions: [
          { id: '1', field: 'reviewStatus', value: 'approved' },
          { id: '2', field: 'reviewStatus', value: 'changes_requested' },
        ],
      }),
    ).toEqual(['is:pr org:acme review:approved', 'is:pr org:acme review:changes_requested']);
  });
});

describe('defaultSections', () => {
  it('produces the six Graphite-style sections, all AND', () => {
    const sections = defaultSections();
    expect(sections.map((s) => s.id)).toEqual([
      'needs-your-review',
      'approved',
      'waiting-for-reviewers',
      'drafts',
      'waiting-for-author',
      'recently-merged',
    ]);
    expect(sections.every((s) => s.query.combinator === 'AND')).toBe(true);
    expect(compile(sections[0]!.query)).toBe('is:pr is:open review-requested:@me review:required');
    expect(compile(sections.find((s) => s.id === 'recently-merged')!.query)).toBe('is:pr is:merged author:@me');
  });
});
