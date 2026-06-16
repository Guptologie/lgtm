import type { CSSProperties, ReactNode } from 'react';
import { ActionList, ActionMenu, Label } from '@primer/react';
import type { SectionConfig } from '../../query/model';
import { useLgtmStore } from '../../app/context';
import { ChevronDownIcon, ChevronRightIcon, KebabIcon } from '../icons';

const iconBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  padding: 0,
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--fgColor-muted, #656d76)',
  cursor: 'pointer',
};

export function SectionHeader({ section, handle }: { section: SectionConfig; handle: ReactNode }) {
  const count = useLgtmStore((s) => s.counts[section.id]);
  const setCollapsed = useLgtmStore((s) => s.setCollapsed);
  const removeSection = useLgtmStore((s) => s.removeSection);
  const openEditor = useLgtmStore((s) => s.openEditor);

  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}>
      {handle}
      <button
        type="button"
        onClick={() => setCollapsed(section.id, !section.collapsed)}
        aria-label={section.collapsed ? 'Expand section' : 'Collapse section'}
        style={iconBtn}
      >
        {section.collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
      </button>
      <strong style={{ fontSize: 14, color: 'var(--fgColor-default, #1f2328)' }}>{section.name}</strong>
      {section.badgeCount && (
        <Label variant="secondary">{count?.status === 'ready' ? (count.value ?? 0) : '…'}</Label>
      )}
      <span style={{ flex: 1 }} />
      <ActionMenu>
        <ActionMenu.Anchor>
          <button type="button" aria-label="Section actions" style={iconBtn}>
            <KebabIcon />
          </button>
        </ActionMenu.Anchor>
        <ActionMenu.Overlay width="small">
          <ActionList>
            <ActionList.Item onSelect={() => openEditor(section.id)}>Edit…</ActionList.Item>
            <ActionList.Item variant="danger" onSelect={() => removeSection(section.id)}>
              Delete
            </ActionList.Item>
          </ActionList>
        </ActionMenu.Overlay>
      </ActionMenu>
    </header>
  );
}
