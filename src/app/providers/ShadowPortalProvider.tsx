import { useEffect, useState, type ReactNode } from 'react';
import { registerPortalRoot } from '@primer/react';
import { PortalContext, useLgtm } from '../context';

/**
 * Creates a portal root INSIDE the shadow root and registers it as Primer's
 * default portal container, so overlays/menus render within the shadow (where
 * the theme variables live) instead of escaping to document.body.
 */
export function ShadowPortalProvider({ children }: { children: ReactNode }) {
  const { shadowRoot } = useLgtm();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-ghpp-portal', '');
    shadowRoot.appendChild(el);
    registerPortalRoot(el);
    setContainer(el);
    return () => {
      el.remove();
    };
  }, [shadowRoot]);

  return <PortalContext.Provider value={container}>{children}</PortalContext.Provider>;
}
