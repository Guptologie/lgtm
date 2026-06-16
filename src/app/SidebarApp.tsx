import { Label } from '@primer/react';
import { useLgtmStore } from './context';

// Minimal sidebar; full nav with live counts arrives in the UI phase.
export function SidebarApp() {
  const sections = useLgtmStore((s) => s.sections);
  return (
    <nav aria-label="GitHub++" style={{ padding: '8px 0' }}>
      <h3
        style={{
          margin: '0 0 4px',
          padding: '0 8px',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--fgColor-muted, #656d76)',
        }}
      >
        GitHub++
      </h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {sections.map((s) => (
          <li
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--fgColor-default, #1f2328)' }}>{s.name}</span>
            {s.badgeCount && <Label variant="secondary">—</Label>}
          </li>
        ))}
      </ul>
    </nav>
  );
}
