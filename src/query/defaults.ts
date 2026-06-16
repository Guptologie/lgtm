import type {
  FilterCondition,
  MeOrLogin,
  PrStatus,
  ReviewStatus,
  SectionConfig,
} from './model';

const ME: MeOrLogin = { kind: 'me' };

const prStatus = (value: PrStatus) => ({ field: 'prStatus', value }) as const;
const draft = (value: boolean) => ({ field: 'draft', value }) as const;
const author = (value: MeOrLogin) => ({ field: 'author', value }) as const;
const reviewRequested = (value: MeOrLogin) => ({ field: 'reviewRequested', value }) as const;
const reviewedBy = (value: MeOrLogin) => ({ field: 'reviewedBy', value }) as const;
const reviewStatus = (value: ReviewStatus) => ({ field: 'reviewStatus', value }) as const;

function section(
  id: string,
  name: string,
  specs: ReadonlyArray<Omit<FilterCondition, 'id'>>,
): SectionConfig {
  return {
    id,
    name,
    collapsed: false,
    badgeCount: true,
    query: {
      combinator: 'AND',
      scope: { orgs: [], repos: [] },
      conditions: specs.map((spec, i) => ({ ...spec, id: `${id}-${i}` }) as FilterCondition),
    },
  };
}

/** Default sections mirroring the Graphite inbox. */
export function defaultSections(): SectionConfig[] {
  return [
    section('needs-your-review', 'Needs your review', [
      prStatus('open'),
      reviewRequested(ME),
      reviewStatus('required'),
    ]),
    section('approved', 'Approved', [prStatus('open'), author(ME), reviewStatus('approved')]),
    section('waiting-for-reviewers', 'Waiting for reviewers', [
      prStatus('open'),
      author(ME),
      reviewStatus('required'),
      draft(false),
    ]),
    section('drafts', 'Drafts', [prStatus('open'), author(ME), draft(true)]),
    section('waiting-for-author', 'Waiting for author', [
      prStatus('open'),
      reviewedBy(ME),
      reviewStatus('changes_requested'),
    ]),
    section('recently-merged', 'Merging and recently merged', [prStatus('merged'), author(ME)]),
  ];
}
