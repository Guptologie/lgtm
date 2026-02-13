# Plan 2: Split into Library + Chrome Extension

## Context

The original plan (plan 1) put everything in a single Chrome extension package. This plan restructures the project into two packages so the React dashboard is a standalone library with zero Chrome API dependencies, importable into any host (Chrome extension, standalone web app, Electron, etc.). The Chrome extension becomes a thin mounting shell.

**Incremental cost**: ~6 new files, ~200 lines of adapter/config code. The library/extension split is mostly mechanical (move files, update imports). Only 3 files need meaningful code changes. The adapter pattern is the single new abstraction.

---

## Monorepo Structure

```
lgtm/
├── pnpm-workspace.yaml                     # packages: ["packages/*", "apps/*"]
├── package.json                             # root scripts: dev, build
├── tsconfig.base.json                       # shared TS config
│
├── packages/
│   └── ui/                                  # @lgtm/ui — standalone React library
│       ├── package.json                     # peer deps: react, react-dom
│       ├── tsconfig.json
│       ├── tsup.config.ts                   # ESM build, emit .d.ts
│       └── src/
│           ├── index.ts                     # barrel export: App, AdapterProvider, types
│           ├── types/
│           │   ├── adapters.ts              # StorageAdapter, AuthAdapter interfaces
│           │   ├── section.ts               # SectionConfig
│           │   ├── pull-request.ts          # NormalizedPR
│           │   └── dashboard.ts             # SerializedDashboard
│           ├── context/
│           │   ├── AdapterContext.tsx        # provides StorageAdapter + AuthAdapter
│           │   ├── DashboardContext.tsx      # useReducer, persists via StorageAdapter
│           │   └── GitHubUserContext.tsx
│           ├── hooks/
│           │   ├── useAuth.ts               # reads token via AuthAdapter
│           │   ├── useSectionData.ts        # per-section GraphQL fetch + polling
│           │   ├── useSortedPRs.ts
│           │   └── useRelativeTime.ts
│           ├── api/
│           │   ├── graphql-client.ts        # thin fetch wrapper
│           │   ├── transforms.ts            # response -> NormalizedPR[]
│           │   └── rate-limiter.ts
│           ├── components/
│           │   ├── App.tsx                  # root: providers, auth gate
│           │   ├── PRDashboard.tsx           # maps sections -> PRSection
│           │   ├── Section/
│           │   │   ├── PRSection.tsx
│           │   │   ├── SectionHeader.tsx
│           │   │   └── ColumnHeaders.tsx
│           │   ├── PRRow.tsx
│           │   └── common/
│           │       └── Spinner.tsx
│           ├── defaults/
│           │   └── default-sections.ts
│           └── styles/
│               └── dashboard.css
│
└── apps/
    └── chrome-extension/                    # @lgtm/chrome-extension — thin shell
        ├── package.json                     # deps: @lgtm/ui (workspace:*)
        ├── tsconfig.json
        ├── vite.config.ts                   # Vite + CRXJS
        ├── manifest.json                    # MV3
        └── src/
            ├── adapters/
            │   ├── chrome-storage.ts        # implements StorageAdapter via chrome.storage.sync
            │   └── chrome-auth.ts           # implements AuthAdapter via chrome.storage.sync
            ├── content/
            │   └── index.tsx                # mount point: Shadow DOM, AdapterProvider, App
            ├── background/
            │   └── service-worker.ts        # badge updates
            └── shared/
                └── messages.ts
```

---

## The Adapter Interfaces

The library defines two interfaces. Consumers provide implementations. This is the only new abstraction.

### `StorageAdapter` (in `packages/ui/src/types/adapters.ts`)

```typescript
interface StorageAdapter {
  load(): Promise<SerializedDashboard | null>;
  save(dashboard: SerializedDashboard): Promise<void>;
  onChange(cb: (dashboard: SerializedDashboard) => void): () => void;
}
```

### `AuthAdapter` (in `packages/ui/src/types/adapters.ts`)

```typescript
interface AuthAdapter {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  onTokenChange(cb: (token: string | null) => void): () => void;
}
```

### How consumers wire them in

```tsx
// apps/chrome-extension/src/content/index.tsx
import { App, AdapterProvider } from "@lgtm/ui";
import { chromeStorage } from "../adapters/chrome-storage";
import { chromeAuth } from "../adapters/chrome-auth";

root.render(
  <AdapterProvider adapters={{ storage: chromeStorage, auth: chromeAuth }}>
    <App currentUser={currentUser} />
  </AdapterProvider>
);
```

The library internally uses `useAdapters()` to access these — no component ever touches `chrome.*` or `localStorage` directly.

---

## What's in the Chrome Extension (~270 lines total)

| File | Lines (est.) | Does |
|------|-------------|------|
| `manifest.json` | 30 | MV3 manifest: content script on `github.com/notifications*`, storage permission |
| `vite.config.ts` | 20 | Vite + CRXJS, imports manifest |
| `src/adapters/chrome-storage.ts` | 45 | `StorageAdapter` impl: `chrome.storage.sync` get/set, `onChanged` listener |
| `src/adapters/chrome-auth.ts` | 35 | `AuthAdapter` impl: `chrome.storage.sync` get/set for token key |
| `src/content/index.tsx` | 60 | Find notification list, Shadow DOM, inject CSS, mount `<AdapterProvider><App />` |
| `src/background/service-worker.ts` | 25 | Badge count updates |
| `src/shared/messages.ts` | 15 | Message types |
| `package.json` | 25 | Deps: `@lgtm/ui` (workspace:*), react, CRXJS |
| `tsconfig.json` | 12 | Extends base, adds chrome types |

Everything else — components, hooks, API layer, types, state management — lives in `@lgtm/ui`.

---

## Build Setup

### `@lgtm/ui` — tsup (library)

```typescript
// packages/ui/tsup.config.ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  external: ["react", "react-dom"],
});
```

### `@lgtm/chrome-extension` — Vite + CRXJS (app)

```typescript
// apps/chrome-extension/vite.config.ts
export default defineConfig({
  plugins: [react(), crx({ manifest })],
});
```

### Dev workflow

```bash
# Terminal 1: library watch (tsup rebuilds on change)
pnpm --filter @lgtm/ui dev

# Terminal 2: extension dev (Vite HMR, picks up library rebuilds)
pnpm --filter @lgtm/chrome-extension dev
```

Or single command: `pnpm dev` at root runs both.

---

## What Changes from Plan 1

| What | Change |
|------|--------|
| `DashboardContext` | Persistence calls go through `StorageAdapter` instead of direct `chrome.storage` |
| `AuthContext` | Replaced by `useAuth` hook that reads from `AuthAdapter` |
| `content/index.ts` | Now imports from `@lgtm/ui`, creates adapters, wraps with `AdapterProvider` |
| `storage/persistence.ts` | Removed from library; logic moves to `chrome-storage.ts` adapter |
| Everything else | Moves from `src/app/` to `packages/ui/src/` — no code changes |

**New files (6)**: `adapters.ts` (interfaces), `AdapterContext.tsx`, `useAuth.ts`, `chrome-storage.ts`, `chrome-auth.ts`, `tsup.config.ts`

---

## What You Gain

- **Dev speed**: Run the UI as a standalone Vite app with localStorage adapters — no Chrome extension reload loop
- **Testability**: Test against in-memory adapters, no Chrome API mocking
- **Portability**: Firefox extension, Electron app, standalone web app — each just needs adapter implementations
- **Clean boundary**: Forces separation of "what is platform" vs "what is application"

## Risks

- **CRXJS + pnpm workspace resolution**: The main friction point. If CRXJS struggles to resolve `@lgtm/ui` from workspace, add a Vite `resolve.alias`. Known pattern, solvable.

---

## Implementation Sequence

1. **Scaffold monorepo** — `pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`, both package shells. Verify `pnpm install` links `@lgtm/ui`.
2. **Types + adapters** — All types in `packages/ui/src/types/`, adapter interfaces, `AdapterContext`, `useAuth`. Build with tsup, verify extension can import.
3. **Chrome adapters** — `chrome-storage.ts` and `chrome-auth.ts`. Wire content script to mount `<AdapterProvider><App />`.
4. **Everything else from Plan 1** — API layer, state management, hooks, components. All in `@lgtm/ui`, Chrome-agnostic. Extension doesn't change after step 3.

## Verification

1. `pnpm install` succeeds, `pnpm -r build` succeeds
2. Extension loads in Chrome, mounts on `github.com/notifications`
3. Token stored via adapter persists across page reloads (check `chrome.storage.sync` in DevTools)
4. Dashboard config persists via adapter
5. Library can be imported into a plain Vite React app with localStorage adapters (no Chrome APIs needed)
