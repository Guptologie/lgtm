import { useEffect, useRef } from 'react';
import type { RouteInfo, SlotId } from '@ghpp/domain';
import { createLgtm } from '../index';
import { createMockServices } from './mocks';
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

  useEffect(() => {
    const active = createLgtm(createMockServices());
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, padding: 16, alignItems: 'start' }}>
      <div ref={sidebarRef} />
      <div ref={mainRef} />
    </div>
  );
}
