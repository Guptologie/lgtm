import { useEffect, useState, type ReactNode } from 'react';
import { BaseStyles, ThemeProvider } from '@primer/react';
import type { ThemeMode } from '@ghpp/domain';
import primitivesCss from '@primer/primitives/dist/css/primitives.css?inline';
import lightCss from '@primer/primitives/dist/css/functional/themes/light.css?inline';
import darkCss from '@primer/primitives/dist/css/functional/themes/dark.css?inline';
import { useLgtm, useServices } from '../context';

// Base primitive vars (always) + both theme variable sets (gated by the
// data-color-mode/data-*-theme attributes on the wrapper below).
const THEME_CSS = `${primitivesCss}\n${lightCss}\n${darkCss}`;
const injected = new WeakSet<ShadowRoot>();

function injectThemeVars(shadowRoot: ShadowRoot): void {
  if (injected.has(shadowRoot)) return;
  injected.add(shadowRoot);
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(THEME_CSS);
    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
  } catch {
    const style = document.createElement('style');
    style.textContent = THEME_CSS;
    shadowRoot.appendChild(style);
  }
}

/**
 * Bridges the host theme into Primer inside the shadow root: injects Primer's
 * CSS variables, mirrors GitHub's light/dark mode, and provides Primer's
 * ThemeProvider + BaseStyles.
 */
export function ThemeBridge({ children }: { children: ReactNode }) {
  const services = useServices();
  const { shadowRoot } = useLgtm();
  const [mode, setMode] = useState<ThemeMode>(services.theme.mode);

  useEffect(() => {
    injectThemeVars(shadowRoot);
    setMode(services.theme.mode);
    return services.theme.subscribe((t) => setMode(t.mode));
  }, [services.theme, shadowRoot]);

  return (
    <ThemeProvider colorMode={mode === 'dark' ? 'night' : 'day'}>
      <div
        data-color-mode={mode}
        data-light-theme="light"
        data-dark-theme="dark"
        style={{ colorScheme: mode }}
      >
        <BaseStyles>{children}</BaseStyles>
      </div>
    </ThemeProvider>
  );
}
