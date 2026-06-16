import type { HostServices, SlotId } from '@ghpp/domain';

export interface LgtmRootProps {
  mountPoint: SlotId;
  services: HostServices;
  shadowRoot: ShadowRoot;
}

// Minimal root; the provider stack, sidebar, and inbox are added in later
// commits. Renders enough to confirm the library mounts into both slots.
export function LgtmRoot({ mountPoint, services }: LgtmRootProps) {
  return (
    <div style={{ font: '13px/1.5 system-ui, sans-serif', color: '#1f2328', padding: 8 }}>
      LGTM · {String(mountPoint)} slot — auth: {services.auth.status}
    </div>
  );
}
