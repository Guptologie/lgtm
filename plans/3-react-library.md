# Plan 3: React Library (@lgtm/ui)

## Overview

This plan details the implementation of `@lgtm/ui`, a standalone React library that renders a Graphite-style GitHub PR dashboard. The library is platform-agnostic and takes all external dependencies (auth token, storage) as props. The Chrome extension will be a thin consumer of this library (covered in a separate plan).

**Key principle**: The library never imports `chrome.*`, `localStorage`, or any platform-specific APIs. All external data flows through props and adapters.

---

## Public API

### Entry Point: `<LGTM>` Component

```tsx
import { LGTM } from "@lgtm/ui";
import "@lgtm/ui/styles.css";

<LGTM
  adapters={{
    storage: myStorageAdapter,
    auth: myAuthAdapter,
  }}
  currentUser={currentGitHubUsername}
/>
```

### Props Interface

```typescript
interface LGTMProps {
  adapters: {
    storage: StorageAdapter;
    auth: AuthAdapter;
  };
  currentUser: string; // GitHub login (e.g., "octocat")
  onError?: (error: Error) => void; // Optional error boundary callback
}
```

### Adapter Interfaces

Consumers must implement these two interfaces:

```typescript
// Storage for dashboard configuration (sections, settings, etc.)
interface StorageAdapter {
  load(): Promise<SerializedDashboard | null>;
  save(dashboard: SerializedDashboard): Promise<void>;
  onChange(callback: (dashboard: SerializedDashboard) => void): () => void; // Returns unsubscribe fn
}

// Authentication: GitHub Personal Access Token
interface AuthAdapter {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  onTokenChange(callback: (token: string | null) => void): () => void; // Returns unsubscribe fn
}
```

### Exported Types

The library exports all its core types for consumers:

```typescript
export type {
  LGTMProps,
  StorageAdapter,
  AuthAdapter,
  SerializedDashboard,
  SectionConfig,
  NormalizedPR,
  DashboardSettings,
  // ... etc
};
```

---

## Internal Architecture

### Component Tree

```
<LGTM> (receives adapters + currentUser)
  └── <AdapterProvider> (provides adapters to all descendants)
      └── <AuthProvider> (manages token, provides useAuth hook)
          └── <DashboardProvider> (manages sections config, provides useDashboard hook)
              ├── AuthGate (shows setup screen if no token)
              └── <PRDashboard>
                  └── <PRSection>[] (one per section config)
                      ├── <SectionHeader>
                      │   ├── Collapse toggle
                      │   ├── Title + count badge
                      │   └── Sort dropdown
                      ├── <ColumnHeaders> (sortable columns)
                      └── <PRRow>[] (one per PR)
                          ├── Unread dot
                          ├── Author avatar
                          ├── Title + repo#number
                          ├── CI status icon
                          ├── Review status + reviewer avatars
                          ├── Merge status
                          ├── Lines changed (+123 / -45)
                          └── Relative time (2h ago)
```

### State Management Strategy

**No Redux, no Zustand** — just Context + useReducer. The state surface is small:

1. **Dashboard Config** (DashboardContext)
   - `sections: SectionConfig[]` — serializable section configs
   - `settings: DashboardSettings` — theme settings
   - Persisted via `StorageAdapter.save()` on every change (debounced 500ms)

2. **Auth State** (AuthProvider)
   - `token: string | null`
   - `isLoading: boolean`
   - Loaded once on mount via `AuthAdapter.getToken()`

3. **Per-Section Data** (local state in `useSectionData` hook)
   - Each `<PRSection>` owns its fetched PR data
   - Not shared between sections
   - Not persisted (ephemeral, refetched on mount)

### Data Flow

```
User interacts with UI
  ↓
Component dispatches action to DashboardContext
  ↓
Reducer updates config state
  ↓
useEffect watches config changes
  ↓
Calls StorageAdapter.save() (debounced)
  ↓
Storage implementation persists to chrome.storage / localStorage / etc
```

---

## Core Types

### `SerializedDashboard` (persisted)

```typescript
interface SerializedDashboard {
  version: number; // Schema version for migrations
  sections: SectionConfig[];
  settings: DashboardSettings;
}

interface SectionConfig {
  id: string; // Stable UUID
  title: string; // "Needs your review"
  query: string; // Raw GraphQL query string
  sort: { field: SortField; direction: "asc" | "desc" };
  collapsed: boolean;
  order: number; // Display order (0 = first)
}

interface DashboardSettings {
  theme: "light" | "dark" | "auto";
}
```

### `NormalizedPR` (ephemeral runtime data)

```typescript
interface NormalizedPR {
  // Identity
  id: string;
  number: number;
  title: string;
  url: string;
  repo: string; // "owner/repo"

  // State
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;

  // Author
  author: {
    login: string;
    avatarUrl: string;
  };

  // Code changes
  additions: number;
  deletions: number;
  changedFiles: number;

  // Reviews
  reviewDecision: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
  reviewers: Array<{
    login: string;
    avatarUrl: string;
    state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING";
  }>;

  // CI
  ciState: "SUCCESS" | "FAILURE" | "PENDING" | "NONE";
  ciChecks: Array<{
    name: string;
    status: "SUCCESS" | "FAILURE" | "PENDING";
    conclusion: string | null;
  }>;

  // Merge
  mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN";

  // Meta
  labels: Array<{ name: string; color: string }>;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isUnread: boolean; // Computed from unread context
}
```

---

## Key Hooks

### `useAuth()`

```typescript
function useAuth(): {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
}
```

- Reads token from `AuthAdapter` on mount
- Subscribes to token changes via `AuthAdapter.onTokenChange()`
- Used by GraphQL client for Authorization header

### `useDashboard()`

```typescript
function useDashboard(): {
  sections: SectionConfig[];
  settings: DashboardSettings;
  dispatch: Dispatch<DashboardAction>;
}
```

Actions:
- `ADD_SECTION`
- `UPDATE_SECTION`
- `DELETE_SECTION`
- `REORDER_SECTIONS`
- `UPDATE_SETTINGS`

Reducer auto-persists to `StorageAdapter` after every action (debounced).

### `useSectionData(config: SectionConfig)`

```typescript
function useSectionData(config: SectionConfig): {
  prs: NormalizedPR[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

**Responsibilities**:
1. Fetch PR data by executing `config.query` via GraphQL client
2. Transform raw response → `NormalizedPR[]` via `transforms.ts`
3. Abort in-flight requests on unmount or config change
4. Route requests through rate limiter (max 3 concurrent, 200ms spacing)
5. Provide manual `refresh()` function for user-triggered updates

**Query preprocessing**: Replace `{currentUser}` placeholder with actual username before sending.

### `useSortedPRs(prs: NormalizedPR[], sort: SortConfig)`

```typescript
function useSortedPRs(prs: NormalizedPR[], sort: SortConfig): NormalizedPR[]
```

Client-side sort. Supports sorting by:
- Updated time (default)
- Created time
- Lines changed
- Review state
- CI state

### `useRelativeTime(timestamp: string)`

```typescript
function useRelativeTime(timestamp: string): string // "2h ago"
```

Updates every minute for live relative times.

---

## API Layer

### GraphQL Client (`api/graphql-client.ts`)

```typescript
async function executeQuery(
  query: string,
  token: string,
  variables?: Record<string, any>
): Promise<any>
```

- Thin wrapper around `fetch("https://api.github.com/graphql", ...)`
- Sets `Authorization: Bearer ${token}` header
- Returns parsed JSON response
- Throws on network errors or GraphQL errors

### Transform Pipeline (`api/transforms.ts`)

```typescript
function transformResponse(response: any): NormalizedPR[]
```

Takes raw GitHub GraphQL response, extracts PR nodes, normalizes into `NormalizedPR[]`.

**Graceful degradation**: Missing fields default to sensible values (e.g., `ciState: "NONE"` if no checks).

### Rate Limiter (`api/rate-limiter.ts`)

```typescript
class RateLimiter {
  async enqueue<T>(fn: () => Promise<T>): Promise<T>
}
```

- Token bucket algorithm: max 3 concurrent requests, 200ms minimum spacing
- Prevents GitHub rate limit 429 errors when many sections fetch in parallel
- All GraphQL requests funnel through this

---

## Default Sections

### Provided Configs (`defaults/default-sections.ts`)

Export 7 pre-configured sections with full GraphQL queries:

1. **Needs your review** — `review-requested:{currentUser}`
2. **Returned to you** — Approved by you, but author pushed new commits
3. **Approved** — All reviews approved, ready to merge
4. **Waiting for reviewers** — No reviews yet, review-requested exists
5. **Drafts** — `is:draft author:{currentUser}`
6. **Waiting for author** — Changes requested, author needs to push
7. **Recently merged** — `is:merged closed:>7days author:{currentUser}`

Each includes:
- Complete GraphQL query (with PR fields, reviews, CI, labels)
- Sensible defaults (collapsed state, sort)
- Unique stable ID

Consumers can use these as-is or customize.

---

## Styling Strategy

### CSS Architecture

- **No CSS-in-JS** — plain CSS file for simplicity
- **BEM naming** — `.pr-dashboard`, `.pr-row__title`, etc.
- **CSS variables for theming** — `--lgtm-bg-primary`, `--lgtm-text-primary`, etc.
- **Single stylesheet** — `styles/dashboard.css`, imported by consumer

### Shadow DOM Consideration

When used in a Chrome extension with Shadow DOM:
- Library doesn't create Shadow DOM itself
- Consumer (extension) creates Shadow DOM and injects CSS manually
- Library CSS is written to be scoped (BEM prevents collisions)

### Theme Support

DashboardSettings includes `theme: "light" | "dark" | "auto"`.

Library applies `data-theme="light|dark"` to root element, CSS responds:

```css
[data-theme="light"] {
  --lgtm-bg-primary: #ffffff;
  --lgtm-text-primary: #24292f;
}

[data-theme="dark"] {
  --lgtm-bg-primary: #0d1117;
  --lgtm-text-primary: #f0f6fc;
}
```

---

## Error Handling

### Error Boundary

Top-level `<ErrorBoundary>` in `<LGTM>` catches render errors:
- Displays fallback UI with retry button
- Calls optional `onError` prop
- Logs to console

### API Errors

`useSectionData` returns `error: Error | null`:
- Section shows error state inline (no dashboard-wide crash)
- User can manually retry per-section via refresh button
- Rate limit errors (429) → show error message with manual retry option

### Missing Token

`<AuthGate>` renders setup screen if `useAuth().token === null`.

---

## File Structure

```
packages/ui/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── src/
    ├── index.ts                          # Barrel export: LGTM, adapters, types
    │
    ├── types/
    │   ├── adapters.ts                   # StorageAdapter, AuthAdapter interfaces
    │   ├── section.ts                    # SectionConfig, SortConfig
    │   ├── pull-request.ts               # NormalizedPR, CIState, ReviewDecision
    │   └── dashboard.ts                  # SerializedDashboard, DashboardSettings
    │
    ├── context/
    │   ├── AdapterContext.tsx            # Provides adapters to descendants
    │   ├── AuthProvider.tsx              # Manages token state via AuthAdapter
    │   ├── DashboardContext.tsx          # useReducer for sections + settings
    │   └── UnreadContext.tsx             # Global unread set (from GitHub notifications API)
    │
    ├── hooks/
    │   ├── useAuth.ts                    # Reads token from AuthProvider
    │   ├── useDashboard.ts               # Reads/writes sections + settings
    │   ├── useSectionData.ts             # Per-section GraphQL fetch
    │   ├── useSortedPRs.ts               # Client-side sort
    │   ├── useRelativeTime.ts            # "2h ago" formatting
    │   └── useUnreadPRs.ts               # Fetches unread notifications
    │
    ├── api/
    │   ├── graphql-client.ts             # executeQuery(query, token)
    │   ├── transforms.ts                 # transformResponse(raw) → NormalizedPR[]
    │   └── rate-limiter.ts               # RateLimiter class
    │
    ├── components/
    │   ├── LGTM.tsx                      # Root: providers + error boundary
    │   ├── AuthGate.tsx                  # Setup screen if no token
    │   ├── PRDashboard.tsx               # Main dashboard: sections
    │   │
    │   ├── SettingsModal.tsx             # Global settings editor
    │   │
    │   ├── Section/
    │   │   ├── PRSection.tsx             # Container: useSectionData + layout
    │   │   ├── SectionHeader.tsx         # Title, count, collapse, sort, refresh
    │   │   ├── ColumnHeaders.tsx         # Sortable column headers
    │   │   └── SectionSettings.tsx       # Per-section settings modal
    │   │
    │   ├── PRRow.tsx                     # Single PR row (all fields inline)
    │   │
    │   ├── ErrorBoundary.tsx             # Top-level error boundary
    │   │
    │   └── common/
    │       ├── Avatar.tsx                # User avatar with tooltip
    │       ├── StatusIcon.tsx            # CI/review/merge status icons
    │       ├── Spinner.tsx               # Loading spinner
    │       └── EmptyState.tsx            # "No PRs" placeholder
    │
    ├── defaults/
    │   └── default-sections.ts           # 7 pre-configured section configs
    │
    ├── styles/
    │   └── dashboard.css                 # All styles, BEM naming, CSS vars
    │
    └── utils/
        ├── debounce.ts                   # Debounce utility
        └── query-preprocessor.ts         # Replace {currentUser} in queries
```

---

## Implementation Sequence

### Phase 1: Foundation (types + adapters + context)

1. **Setup package**
   - `package.json` with peer deps: `react`, `react-dom`
   - `tsup.config.ts` for ESM build + `.d.ts` generation
   - `tsconfig.json` extending base

2. **Define types**
   - All interfaces in `types/`: adapters, section, pull-request, dashboard
   - Export from `index.ts`

3. **Create adapter system**
   - `AdapterContext.tsx` — provides adapters via context
   - Wire into `<LGTM>` component shell

4. **Auth management**
   - `AuthProvider.tsx` — loads token via `AuthAdapter.getToken()` on mount
   - Subscribes to changes via `AuthAdapter.onTokenChange()`
   - `useAuth()` hook for descendants

5. **Dashboard state**
   - `DashboardContext.tsx` — `useReducer` with actions for CRUD on sections
   - Load initial state from `StorageAdapter.load()` on mount
   - Auto-save on state changes (debounced 500ms) via `StorageAdapter.save()`
   - `useDashboard()` hook

**Deliverable**: `<LGTM>` component that accepts adapters, loads/saves dashboard config, provides `useAuth()` and `useDashboard()` hooks.

---

### Phase 2: API Layer (GraphQL + transforms)

6. **GraphQL client**
   - `graphql-client.ts` — `executeQuery(query, token)` function
   - Thin fetch wrapper with Authorization header
   - Error handling for network + GraphQL errors

7. **Transform pipeline**
   - `transforms.ts` — `transformResponse(raw) → NormalizedPR[]`
   - Extract PR nodes from search results
   - Normalize fields (handle nulls, compute derived fields)
   - Add `isUnread` from unread context

8. **Rate limiter**
   - `rate-limiter.ts` — Token bucket queue
   - Max 3 concurrent, 200ms minimum spacing
   - Integrate into GraphQL client

9. **Query preprocessor**
   - `utils/query-preprocessor.ts` — replace `{currentUser}` placeholder
   - Called before sending query to GitHub

**Deliverable**: Working API layer that executes GraphQL queries and returns normalized PR data.

---

### Phase 3: Data Fetching (section data hook)

10. **Unread tracking**
    - `UnreadContext.tsx` — fetch notifications from REST API
    - Build `Set<prUrl>` of unread PRs
    - Provide via context

11. **Section data hook**
    - `useSectionData(config)` — core hook
    - Fetch PRs by executing `config.query`
    - Transform → `NormalizedPR[]`
    - Abort on unmount
    - Return `{ prs, totalCount, isLoading, error, refresh }`

12. **Sort hook**
    - `useSortedPRs(prs, sort)` — client-side sort
    - Support all sort fields

**Deliverable**: `useSectionData` hook that fetches and transforms PR data with manual refresh capability.

---

### Phase 4: UI Components

13. **Design tokens**
    - `styles/dashboard.css` — CSS variables for colors, spacing, typography
    - Light/dark theme support

14. **Common components**
    - `Avatar.tsx`, `StatusIcon.tsx`, `Spinner.tsx`, `EmptyState.tsx`

15. **PR Row**
    - `PRRow.tsx` — single file, all PR fields inline
    - Unread dot, avatar, title, CI, reviews, merge state, lines changed, time
    - Click → open PR on GitHub in new tab

16. **Section components**
    - `SectionHeader.tsx` — title, count, collapse, sort dropdown, refresh button
    - `ColumnHeaders.tsx` — sortable headers (click to sort)
    - `PRSection.tsx` — container: calls `useSectionData`, maps to `<PRRow>[]`

17. **Dashboard layout**
    - `PRDashboard.tsx` — maps `sections` from context to `<PRSection>[]`
    - Render in order (sorted by `section.order`)

**Deliverable**: Fully functional dashboard UI.

---

### Phase 5: Settings & Polish

19. **Auth gate**
    - `AuthGate.tsx` — if no token, show setup screen
    - Token input + save button → calls `setToken()`

20. **Settings modal**
    - `SettingsModal.tsx` — edit global settings
    - Theme selector
    - Export/import config (download/upload JSON)

21. **Section settings**
    - `SectionSettings.tsx` — edit section config
    - Title, query, collapse
    - Delete section button

22. **Error boundary**
    - `ErrorBoundary.tsx` — catch render errors
    - Fallback UI with retry

23. **Default sections**
    - `defaults/default-sections.ts` — 7 pre-configured sections
    - Used as initial state if no saved config

**Deliverable**: Complete library with setup flow, settings, error handling.

---

### Phase 6: Build & Export

24. **Build setup**
    - tsup config: ESM output, `.d.ts` generation
    - External: react, react-dom
    - Bundle CSS into `dist/styles.css`

25. **Barrel exports**
    - `index.ts` exports: `LGTM`, adapter interfaces, all types
    - Consumers import: `import { LGTM } from "@lgtm/ui"`

26. **Package.json metadata**
    - `main`, `module`, `types` fields
    - `peerDependencies`: react >= 18, react-dom >= 18
    - `exports` field for modern bundlers

**Deliverable**: Publishable NPM package (can be tested by symlinking into extension).

---

## Testing Strategy

### Unit Tests (Vitest)

- **Hooks**: Test `useSectionData`, `useSortedPRs`, `useRelativeTime` with mock adapters
- **Transforms**: Test `transformResponse` with fixture GraphQL responses
- **Rate limiter**: Test concurrency limiting, spacing
- **Reducer**: Test dashboard reducer actions

### Integration Tests (Vitest + Testing Library)

- Mount `<LGTM>` with in-memory adapters
- Verify sections load, render PRs
- Test collapse/expand, sort, refresh
- Test settings save/load

### Manual Testing Checklist

- [ ] Dashboard loads with default sections
- [ ] PRs appear in correct sections
- [ ] Collapse/expand persists
- [ ] Sort changes column order
- [ ] Section refresh button refetches data for that section
- [ ] Settings modal saves changes
- [ ] Light/dark theme switches correctly
- [ ] Auth gate appears when no token

---

## Build Artifacts

After `pnpm build`:

```
packages/ui/dist/
├── index.js           # ESM bundle
├── index.d.ts         # TypeScript definitions
└── styles.css         # Bundled styles
```

Consumers import:

```tsx
import { LGTM } from "@lgtm/ui";
import "@lgtm/ui/styles.css";
```

---

## Usage Example (Standalone Web App)

```tsx
// Example: use in a plain React app with localStorage
import { LGTM, StorageAdapter, AuthAdapter } from "@lgtm/ui";
import "@lgtm/ui/styles.css";

const localStorageAdapter: StorageAdapter = {
  async load() {
    const json = localStorage.getItem("dashboard");
    return json ? JSON.parse(json) : null;
  },
  async save(dashboard) {
    localStorage.setItem("dashboard", JSON.stringify(dashboard));
  },
  onChange(cb) {
    const handler = (e: StorageEvent) => {
      if (e.key === "dashboard" && e.newValue) {
        cb(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};

const localAuthAdapter: AuthAdapter = {
  async getToken() {
    return localStorage.getItem("github_token");
  },
  async setToken(token) {
    localStorage.setItem("github_token", token);
  },
  async clearToken() {
    localStorage.removeItem("github_token");
  },
  onTokenChange(cb) {
    const handler = (e: StorageEvent) => {
      if (e.key === "github_token") {
        cb(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};

function StandaloneDashboard() {
  return (
    <LGTM
      adapters={{
        storage: localStorageAdapter,
        auth: localAuthAdapter,
      }}
      currentUser="octocat"
    />
  );
}
```

---

## Success Criteria

The library is complete when:

1. **Zero platform dependencies** — no imports of `chrome.*`, `localStorage`, `sessionStorage`, etc.
2. **Adapter pattern works** — can mount in a standalone React app with localStorage adapters
3. **Fully typed** — all exports have TypeScript definitions
4. **Self-contained** — single CSS file, no external stylesheets required
5. **Default sections work** — 7 pre-configured sections fetch real PR data from GitHub
6. **State persists** — changes to sections/settings save via `StorageAdapter`
7. **Error handling** — API errors, missing token, render errors all handled gracefully
8. **Performance** — rate limiter prevents 429 errors

---

## Next Steps

After this library is complete:
- **Plan 4**: Chrome extension implementation (thin shell that provides Chrome adapters)
- **Plan 5**: Standalone demo app (for development/testing without extension)
- **Plan 6**: Advanced features (keyboard shortcuts, bulk actions, custom queries)
