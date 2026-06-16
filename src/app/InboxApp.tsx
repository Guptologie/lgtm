import { Button, Label } from '@primer/react';
import { useLgtmStore } from './context';

// Minimal inbox; drag-and-drop sections + PR cards + data arrive in the UI phase.
export function InboxApp() {
  const sections = useLgtmStore((s) => s.sections);
  return (
    <div style={{ padding: 8 }}>
      {sections.map((s) => (
        <section
          key={s.id}
          style={{
            marginBottom: 12,
            border: '1px solid var(--borderColor-default, #d0d7de)',
            borderRadius: 6,
            background: 'var(--bgColor-default, #ffffff)',
          }}
        >
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderBottom: '1px solid var(--borderColor-muted, #d8dee4)',
            }}
          >
            <strong style={{ fontSize: 14, color: 'var(--fgColor-default, #1f2328)' }}>{s.name}</strong>
            {s.badgeCount && <Label variant="secondary">—</Label>}
          </header>
          <div style={{ padding: 12, fontSize: 13, color: 'var(--fgColor-muted, #656d76)' }}>
            No PRs loaded yet.
          </div>
        </section>
      ))}
      <Button>New section</Button>
    </div>
  );
}
