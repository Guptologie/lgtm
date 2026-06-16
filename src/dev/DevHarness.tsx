import { useEffect, useRef, useState } from 'react';
import type { RouteInfo, SlotId } from '@ghpp/domain';
import { createLgtm } from '../index';
import { createMockServices, type MockThemeInfo } from './mocks';
import { mirrorStyles } from './mirror-styles';

const ROUTE: RouteInfo = {
  href: 'https://github.com/notifications',
  pathname: '/notifications',
  kind: 'notifications',
  params: {},
};

/**
 * Mounts lgtm exactly like the host would — two shadow roots (sidebar + main)
 * sharing one ActiveLibrary — against mock services. No Chrome, no token.
 */
export function DevHarness() {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<MockThemeInfo | null>(null);
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const services = createMockServices();
    themeRef.current = services.theme;
    const active = createLgtm(services);
    const cleanups: Array<() => void> = [];

    const mountInto = (host: HTMLDivElement | null, slot: SlotId) => {
      if (!host) return;
      const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
      const container = document.createElement('div');
      shadow.appendChild(container);
      cleanups.push(mirrorStyles(shadow));
      active.mount({ container, shadowRoot: shadow, slot, route: ROUTE });
    };

    mountInto(sidebarRef.current, 'sidebar');
    mountInto(mainRef.current, 'main');

    return () => {
      active.dispose();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const toggleTheme = () => {
    themeRef.current?.toggle();
    setMode((m) => (m === 'light' ? 'dark' : 'light'));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: mode === 'dark' ? '#0d1117' : '#f6f8fa',
      }}
    >
      <div style={{ display: 'flex', gap: 8, padding: 12, alignItems: 'center' }}>
        <strong style={{ font: '600 13px system-ui', color: mode === 'dark' ? '#e6edf3' : '#1f2328' }}>
          LGTM dev harness
        </strong>
        <button type="button" onClick={toggleTheme}>
          Toggle theme ({mode})
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, padding: 16, alignItems: 'start' }}>
        <div ref={sidebarRef} />
        <div ref={mainRef} />
      </div>
    </div>
  );
}
