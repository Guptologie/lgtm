import { createRoot, type Root } from 'react-dom/client';
import {
  CONTRACT_VERSION,
  type ActiveLibrary,
  type HostServices,
  type LibraryModule,
  type MountContext,
  type SlotId,
} from '@ghpp/domain';
import { LgtmRoot } from './app/LgtmRoot';

/**
 * Activate lgtm against an injected services bag. Returns an ActiveLibrary that
 * mounts both the 'sidebar' and 'main' slots; state shared across slots will
 * live here (added with the store in a later commit).
 */
export function createLgtm(services: HostServices): ActiveLibrary {
  const roots = new Map<SlotId, Root>();

  return {
    slots: () => ['sidebar', 'main'],
    mount({ container, slot, shadowRoot }: MountContext) {
      const root = createRoot(container);
      root.render(<LgtmRoot mountPoint={slot} services={services} shadowRoot={shadowRoot} />);
      roots.set(slot, root);
    },
    unmount(slot) {
      roots.get(slot)?.unmount();
      roots.delete(slot);
    },
    dispose() {
      for (const root of roots.values()) root.unmount();
      roots.clear();
    },
  };
}

export const lgtmLibrary: LibraryModule = {
  id: 'lgtm',
  displayName: 'LGTM Inbox',
  contractRange: `^${CONTRACT_VERSION}`,
  match: (url) => url.hostname === 'github.com' && url.pathname.startsWith('/notifications'),
  activate: (services) => createLgtm(services),
};

export default lgtmLibrary;
