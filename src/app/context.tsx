import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { HostServices } from '@ghpp/domain';
import type { LgtmState, LgtmStore } from '../store/store';

export interface LgtmContextValue {
  services: HostServices;
  store: LgtmStore;
  shadowRoot: ShadowRoot;
}

const LgtmContext = createContext<LgtmContextValue | null>(null);
export const LgtmProvider = LgtmContext.Provider;

export function useLgtm(): LgtmContextValue {
  const value = useContext(LgtmContext);
  if (!value) throw new Error('useLgtm must be used within <LgtmProvider>');
  return value;
}

export function useServices(): HostServices {
  return useLgtm().services;
}

/** Subscribe to a slice of the shared store. */
export function useLgtmStore<T>(selector: (state: LgtmState) => T): T {
  const { store } = useLgtm();
  return useStore(store, selector);
}

/** Portal container living inside the shadow root (set by ShadowPortalProvider). */
export const PortalContext = createContext<HTMLElement | null>(null);
export const usePortalContainer = (): HTMLElement | null => useContext(PortalContext);
