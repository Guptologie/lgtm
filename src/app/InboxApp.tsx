import { useLgtmStore } from './context';
import { InboxToolbar } from '../components/inbox/InboxToolbar';
import { SectionList } from '../components/inbox/SectionList';

export function InboxApp() {
  const loaded = useLgtmStore((s) => s.loaded);
  return (
    <div style={{ padding: 8, maxWidth: 960 }}>
      <InboxToolbar />
      {loaded ? (
        <SectionList />
      ) : (
        <div style={{ padding: 16, fontSize: 13, color: 'var(--fgColor-muted, #656d76)' }}>Loading…</div>
      )}
    </div>
  );
}
