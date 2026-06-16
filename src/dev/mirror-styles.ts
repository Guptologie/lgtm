/**
 * Harness-only: copy document <style> CSS into a shadow root so Vite-injected
 * Primer component styles apply inside the shadow boundary (the extension does
 * this via WXT's cssInjectionMode: 'ui'). Returns a disposer.
 */
export function mirrorStyles(shadow: ShadowRoot): () => void {
  const sheet = new CSSStyleSheet();
  shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];

  const apply = () => {
    const css = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    try {
      sheet.replaceSync(css);
    } catch {
      /* ignore malformed transient CSS */
    }
  };

  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.head, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
