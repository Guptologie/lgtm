import { Button, Spinner } from '@primer/react';

const wrap: React.CSSProperties = {
  padding: '16px 12px',
  fontSize: 13,
  color: 'var(--fgColor-muted, #656d76)',
  borderTop: '1px solid var(--borderColor-muted, #d8dee4)',
};

export function SectionLoading() {
  return (
    <div style={{ ...wrap, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Spinner size="small" />
      Loading pull requests…
    </div>
  );
}

export function SectionEmpty() {
  return <div style={wrap}>No pull requests match this filter.</div>;
}

export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ ...wrap, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: 'var(--fgColor-danger, #cf222e)' }}>Couldn’t load: {message}</span>
      <Button size="small" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
