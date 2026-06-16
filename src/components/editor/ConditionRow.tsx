import { Checkbox, Select, TextInput } from '@primer/react';
import type {
  ConditionField,
  FilterCondition,
  MeOrLogin,
  PrStatus,
  ReviewStatus,
} from '../../query/model';
import { XIcon } from '../icons';
import { FIELD_OPTIONS, defaultCondition } from './condition-helpers';

function MeOrLoginControl({ value, onChange }: { value: MeOrLogin; onChange: (v: MeOrLogin) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
      <Select
        value={value.kind}
        onChange={(e) =>
          onChange(
            e.target.value === 'me'
              ? { kind: 'me' }
              : { kind: 'login', login: value.kind === 'login' ? value.login : '' },
          )
        }
      >
        <Select.Option value="me">@me</Select.Option>
        <Select.Option value="login">User…</Select.Option>
      </Select>
      {value.kind === 'login' && (
        <TextInput
          value={value.login}
          placeholder="login"
          onChange={(e) => onChange({ kind: 'login', login: e.target.value })}
        />
      )}
    </div>
  );
}

function ValueControl({
  condition,
  onChange,
}: {
  condition: FilterCondition;
  onChange: (c: FilterCondition) => void;
}) {
  switch (condition.field) {
    case 'prStatus':
      return (
        <Select
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value as PrStatus })}
        >
          <Select.Option value="open">Open</Select.Option>
          <Select.Option value="closed">Closed</Select.Option>
          <Select.Option value="merged">Merged</Select.Option>
        </Select>
      );
    case 'draft':
      return (
        <Select
          value={String(condition.value)}
          onChange={(e) => onChange({ ...condition, value: e.target.value === 'true' })}
        >
          <Select.Option value="true">Yes</Select.Option>
          <Select.Option value="false">No</Select.Option>
        </Select>
      );
    case 'reviewStatus':
      return (
        <Select
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value as ReviewStatus })}
        >
          <Select.Option value="required">Required</Select.Option>
          <Select.Option value="approved">Approved</Select.Option>
          <Select.Option value="changes_requested">Changes requested</Select.Option>
          <Select.Option value="none">None</Select.Option>
        </Select>
      );
    case 'label':
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <TextInput
              block
              value={condition.value}
              placeholder="label name"
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <Checkbox
              checked={condition.negate ?? false}
              onChange={(e) => onChange({ ...condition, negate: e.target.checked })}
            />
            exclude
          </label>
        </div>
      );
    default:
      return <MeOrLoginControl value={condition.value} onChange={(v) => onChange({ ...condition, value: v })} />;
  }
}

export function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: FilterCondition;
  onChange: (c: FilterCondition) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <Select
        value={condition.field}
        onChange={(e) => onChange(defaultCondition(condition.id, e.target.value as ConditionField))}
      >
        {FIELD_OPTIONS.map((o) => (
          <Select.Option key={o.value} value={o.value}>
            {o.label}
          </Select.Option>
        ))}
      </Select>
      <ValueControl condition={condition} onChange={onChange} />
      <button
        type="button"
        aria-label="Remove condition"
        onClick={onRemove}
        style={{
          display: 'inline-flex',
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          border: 0,
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--fgColor-muted, #656d76)',
          cursor: 'pointer',
        }}
      >
        <XIcon />
      </button>
    </div>
  );
}
