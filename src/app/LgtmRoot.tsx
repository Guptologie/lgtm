import type { HostServices, SlotId } from '@ghpp/domain';
import type { LgtmStore } from '../store/store';
import { LgtmProvider } from './context';
import { ThemeBridge } from './providers/ThemeBridge';
import { ShadowPortalProvider } from './providers/ShadowPortalProvider';
import { SidebarApp } from './SidebarApp';
import { InboxApp } from './InboxApp';

export interface LgtmRootProps {
  mountPoint: SlotId;
  services: HostServices;
  store: LgtmStore;
  shadowRoot: ShadowRoot;
}

/** Provider stack shared by both surfaces; renders the surface for the slot. */
export function LgtmRoot({ mountPoint, services, store, shadowRoot }: LgtmRootProps) {
  return (
    <LgtmProvider value={{ services, store, shadowRoot }}>
      <ThemeBridge>
        <ShadowPortalProvider>
          {mountPoint === 'sidebar' ? <SidebarApp /> : <InboxApp />}
        </ShadowPortalProvider>
      </ThemeBridge>
    </LgtmProvider>
  );
}
