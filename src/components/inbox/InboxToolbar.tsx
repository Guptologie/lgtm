import { Button } from '@primer/react';
import type { SectionConfig } from '../../query/model';
import { useLgtmStore } from '../../app/context';
import { PlusIcon, SyncIcon } from '../icons';

function newSection(): SectionConfig {
  const id = `section-${crypto.randomUUID()}`;
  return {
    id,
    name: 'New section',
    collapsed: false,
    badgeCount: true,
    query: {
      combinator: 'AND',
      scope: { orgs: [], repos: [] },
      conditions: [
        { id: `${id}-0`, field: 'prStatus', value: 'open' },
        { id: `${id}-1`, field: 'author', value: { kind: 'me' } },
      ],
    },
  };
}

export function InboxToolbar() {
  const refreshVisible = useLgtmStore((s) => s.refreshVisible);
  const upsertSection = useLgtmStore((s) => s.upsertSection);
  const openEditor = useLgtmStore((s) => s.openEditor);

  const addSection = () => {
    const section = newSection();
    upsertSection(section);
    openEditor(section.id);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 4px 12px',
      }}
    >
      <strong style={{ fontSize: 16, color: 'var(--fgColor-default, #1f2328)' }}>Inbox</strong>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="small" leadingVisual={SyncIcon} onClick={() => void refreshVisible()}>
          Refresh
        </Button>
        <Button size="small" variant="primary" leadingVisual={PlusIcon} onClick={addSection}>
          New section
        </Button>
      </div>
    </div>
  );
}
