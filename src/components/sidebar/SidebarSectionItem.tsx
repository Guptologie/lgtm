import type { CSSProperties } from 'react';
import { Label, Spinner } from '@primer/react';
import type { SectionConfig } from '../../query/model';
import { useLgtmStore } from '../../app/context';

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '6px 8px',
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 14,
  color: 'var(--fgColor-default, #1f2328)',
};

export function SidebarSectionItem({ section }: { section: SectionConfig }) {
  const count = useLgtmStore((s) => s.counts[section.id]);
  const focused = useLgtmStore((s) => s.ui.focusedSectionId === section.id);
  const focusSection = useLgtmStore((s) => s.focusSection);
  const setCollapsed = useLgtmStore((s) => s.setCollapsed);

  const onClick = () => {
    setCollapsed(section.id, false);
    focusSection(section.id);
  };

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        style={{ ...itemStyle, background: focused ? 'var(--bgColor-muted, #f6f8fa)' : 'transparent' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {section.name}
        </span>
        {section.badgeCount && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>
            {count?.status === 'loading' && <Spinner size="small" />}
            {count?.status === 'ready' && <Label variant="secondary">{count.value ?? 0}</Label>}
          </span>
        )}
      </button>
    </li>
  );
}
