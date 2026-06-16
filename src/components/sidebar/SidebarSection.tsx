import { useLgtmStore } from '../../app/context';
import { SidebarSectionItem } from './SidebarSectionItem';

/** The "GitHub++" nav group injected into GitHub's notifications sidebar. */
export function SidebarSection() {
  const sections = useLgtmStore((s) => s.sections);
  return (
    <nav aria-label="GitHub++" style={{ padding: '8px 0' }}>
      <h3
        style={{
          margin: '0 0 4px',
          padding: '0 8px',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--fgColor-muted, #656d76)',
        }}
      >
        GitHub++
      </h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {sections.map((s) => (
          <SidebarSectionItem key={s.id} section={s} />
        ))}
      </ul>
    </nav>
  );
}
