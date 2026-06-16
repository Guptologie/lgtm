import { useEffect, useState } from 'react';
import { Button, Checkbox, FormControl, Select, TextInput } from '@primer/react';
import type { Combinator, FilterQuery, SectionConfig } from '../../query/model';
import { useLgtmStore } from '../../app/context';
import { PlusIcon } from '../icons';
import { ConditionRow } from './ConditionRow';
import { defaultCondition } from './condition-helpers';
import { usePreviewCount } from './usePreviewCount';

const parseList = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export function SectionEditorDrawer() {
  const editingId = useLgtmStore((s) => s.ui.editorOpenFor);
  const section = useLgtmStore((s) => s.sections.find((x) => x.id === editingId) ?? null);
  const upsertSection = useLgtmStore((s) => s.upsertSection);
  const removeSection = useLgtmStore((s) => s.removeSection);
  const openEditor = useLgtmStore((s) => s.openEditor);

  const [draft, setDraft] = useState<SectionConfig | null>(null);
  useEffect(() => {
    setDraft(section ? structuredClone(section) : null);
  }, [editingId]); // re-init when which section is open changes

  const preview = usePreviewCount(draft?.query ?? EMPTY_QUERY);

  if (!editingId || !draft) return null;

  const setQuery = (patch: Partial<FilterQuery>) =>
    setDraft({ ...draft, query: { ...draft.query, ...patch } });

  const close = () => openEditor(null);
  const save = () => {
    upsertSection(draft);
    close();
  };
  const remove = () => {
    removeSection(draft.id);
    close();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000 }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <aside
        role="dialog"
        aria-label="Update section"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: 440,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bgColor-default, #ffffff)',
          borderLeft: '1px solid var(--borderColor-default, #d0d7de)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 16px', color: 'var(--fgColor-default, #1f2328)' }}>
            Update section
          </h2>

          <FormControl>
            <FormControl.Label>Section name</FormControl.Label>
            <TextInput block value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </FormControl>

          <div style={{ marginTop: 16 }}>
            <FormControl>
              <FormControl.Label>Combine conditions with</FormControl.Label>
              <Select
                value={draft.query.combinator}
                onChange={(e) => setQuery({ combinator: e.target.value as Combinator })}
              >
                <Select.Option value="AND">All (AND)</Select.Option>
                <Select.Option value="OR">Any (OR)</Select.Option>
              </Select>
            </FormControl>
            {draft.query.combinator === 'OR' && (
              <p style={{ fontSize: 12, color: 'var(--fgColor-muted, #656d76)', margin: '6px 0 0' }}>
                OR sections compute their count from loaded results and don’t show a sidebar badge.
              </p>
            )}
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: '16px 0 0' }}>
            <legend style={{ fontSize: 12, fontWeight: 600, color: 'var(--fgColor-default, #1f2328)' }}>
              Conditions
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {draft.query.conditions.map((c) => (
                <ConditionRow
                  key={c.id}
                  condition={c}
                  onChange={(next) =>
                    setQuery({ conditions: draft.query.conditions.map((x) => (x.id === c.id ? next : x)) })
                  }
                  onRemove={() =>
                    setQuery({ conditions: draft.query.conditions.filter((x) => x.id !== c.id) })
                  }
                />
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <Button
                size="small"
                leadingVisual={PlusIcon}
                onClick={() =>
                  setQuery({
                    conditions: [
                      ...draft.query.conditions,
                      defaultCondition(`${draft.id}-${crypto.randomUUID()}`, 'prStatus'),
                    ],
                  })
                }
              >
                Add condition
              </Button>
            </div>
          </fieldset>

          <div style={{ marginTop: 16 }}>
            <FormControl>
              <FormControl.Label>Organizations (comma-separated)</FormControl.Label>
              <TextInput
                block
                placeholder="acme, my-org"
                value={draft.query.scope.orgs.join(', ')}
                onChange={(e) => setQuery({ scope: { ...draft.query.scope, orgs: parseList(e.target.value) } })}
              />
            </FormControl>
          </div>
          <div style={{ marginTop: 12 }}>
            <FormControl>
              <FormControl.Label>Repositories (owner/name, comma-separated)</FormControl.Label>
              <TextInput
                block
                placeholder="acme/api, acme/web"
                value={draft.query.scope.repos.join(', ')}
                onChange={(e) => setQuery({ scope: { ...draft.query.scope, repos: parseList(e.target.value) } })}
              />
            </FormControl>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 14 }}>
            <Checkbox
              checked={draft.badgeCount}
              onChange={(e) => setDraft({ ...draft, badgeCount: e.target.checked })}
            />
            Show count badge
          </label>
        </div>

        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 16,
            borderTop: '1px solid var(--borderColor-default, #d0d7de)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--fgColor-muted, #656d76)' }}>
            {preview.status === 'ready'
              ? `≈ ${preview.count} pull request${preview.count === 1 ? '' : 's'}`
              : preview.status === 'error'
                ? 'Preview unavailable'
                : 'Counting…'}
          </span>
          <span style={{ flex: 1 }} />
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </footer>
      </aside>
    </div>
  );
}

const EMPTY_QUERY: FilterQuery = { combinator: 'AND', conditions: [], scope: { orgs: [], repos: [] } };
