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
import { createLgtmStore } from './store/store';
import { startPolling } from './data/poll-controller';

/**
 * Activate lgtm against an injected services bag. A single store backs both the
 * 'sidebar' and 'main' slots, so counts/layout stay in sync across surfaces.
 */
export function createLgtm(services: HostServices): ActiveLibrary {
  const { store, dispose: disposeStore } = createLgtmStore(services);
  const stopPolling = startPolling(store);
  void store.getState().load();

  const roots = new Map<SlotId, Root>();

  return {
    slots: () => ['sidebar', 'main'],
    mount({ container, slot, shadowRoot }: MountContext) {
      const root = createRoot(container);
      root.render(
        <LgtmRoot mountPoint={slot} services={services} store={store} shadowRoot={shadowRoot} />,
      );
      roots.set(slot, root);
    },
    unmount(slot) {
      roots.get(slot)?.unmount();
      roots.delete(slot);
    },
    dispose() {
      for (const root of roots.values()) root.unmount();
      roots.clear();
      stopPolling();
      disposeStore();
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
