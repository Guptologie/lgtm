import type { LgtmStore } from '../store/store';

const DEFAULT_INTERVAL_MS = 60_000;

/**
 * Periodically refreshes section counts while the tab is visible, and refreshes
 * counts + visible cards on focus/visibility regain (stale-while-revalidate).
 * Returns a disposer.
 */
export function startPolling(store: LgtmStore, intervalMs = DEFAULT_INTERVAL_MS): () => void {
  const tick = () => {
    if (document.visibilityState === 'visible') void store.getState().refreshCounts();
  };
  const onFocus = () => {
    if (document.visibilityState === 'visible') void store.getState().refreshVisible();
  };

  const timer = setInterval(tick, intervalMs);
  document.addEventListener('visibilitychange', onFocus);
  window.addEventListener('focus', onFocus);

  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onFocus);
    window.removeEventListener('focus', onFocus);
  };
}
