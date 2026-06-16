import type { ConditionField, FilterCondition } from '../../query/model';

export const FIELD_OPTIONS: ReadonlyArray<{ value: ConditionField; label: string }> = [
  { value: 'prStatus', label: 'PR status' },
  { value: 'draft', label: 'Draft' },
  { value: 'author', label: 'Author' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'reviewRequested', label: 'Review requested from' },
  { value: 'reviewedBy', label: 'Reviewed by' },
  { value: 'reviewStatus', label: 'Review status' },
  { value: 'label', label: 'Label' },
];

export const isMeOrLoginField = (f: ConditionField): boolean =>
  f === 'author' || f === 'assignee' || f === 'reviewRequested' || f === 'reviewedBy';

/** A sensible default condition value when a row's field changes. */
export function defaultCondition(id: string, field: ConditionField): FilterCondition {
  switch (field) {
    case 'prStatus':
      return { id, field, value: 'open' };
    case 'draft':
      return { id, field, value: false };
    case 'author':
    case 'assignee':
    case 'reviewRequested':
    case 'reviewedBy':
      return { id, field, value: { kind: 'me' } };
    case 'reviewStatus':
      return { id, field, value: 'required' };
    case 'label':
      return { id, field, value: '' };
  }
}
