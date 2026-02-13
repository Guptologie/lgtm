# LGTM - Graphite-Style PR Dashboard Chrome Extension

## Context

GitHub's notification inbox is a flat, unsorted list of notifications with minimal PR context (no CI status, no review state, no lines changed). Graphite's PR overview groups PRs into meaningful sections (Needs review, Approved, Waiting for reviewers, etc.) with rich per-PR data. This project builds a React app that replaces GitHub's notification list view with a Graphite-style PR dashboard, injected via a Chrome extension.

## Scope

- Replace **only** the inbox list area on `github.com/notifications` - GitHub's left sidebar (Inbox/Saved/Done, Filters, Repositories) stays untouched
- Group PRs into configurable, collapsible sections (like Graphite)
- Each section independently fetches its own data via GitHub GraphQL API
- Section configs + queries are fully JSON-serializable for persistence
- Auth token is provided externally (PAT stored in chrome.storage, injected via context)

---

## Architecture Overview

```
Chrome Extension (content script on /notifications)
  └── Shadow DOM (style isolation from GitHub)
      └── React App
          ├── AuthContext (token provider)
          ├── GitHubUserContext (current user)
          └── DashboardContext (serializable section configs + reducer)
              └── PRDashboard
                  ├── Toolbar (repo selector, refresh all)
                  └── PRSection[] (one per config, each owns its data fetching)
                      ├── SectionHeader (title, count, sort, settings)
                      ├── ColumnHeaders (sortable)
                      └── PRRow[] (pure presentational)
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API | GitHub GraphQL | Single request per section gets PRs + reviews + CI + labels. REST would need N+1 calls |
| State mgmt | React Context + useReducer | Config is small, changes infrequently. No need for Zustand/Redux |
| Data fetching | Custom `useSectionData` hook per section | Sections are fully independent: own loading, error, polling |
| Query storage | Raw GraphQL strings | Each section stores its complete GraphQL query. Claude generates them. No query builder needed -- maximally flexible, any valid GitHub GraphQL works |
| Serialization | Config only (not fetched data) | Section queries are the "source of truth"; PR data is ephemeral/refetchable |
| Style isolation | Shadow DOM | GitHub's CSS is huge; prevents bidirectional style collisions |
| Auth | User-provided PAT via `AuthContext` | Explicit, user-controlled, uses official API. Token injected via context so source is swappable later |
| Build | Vite + CRXJS plugin | Standard modern Chrome extension toolchain with HMR |
| Polling | Per-section intervals (default 2min) | GitHub has no WebSocket/SSE for PR updates |

---

## Data Model (TypeScript Types)

### Serializable (persisted to chrome.storage.sync)

**`SectionConfig`** - The core unit. Everything needed to recreate a section:
- `id: string` - stable unique ID
- `title: string` - e.g. "Needs your review"
- `query: string` - **raw GraphQL query string**, executed as-is against GitHub's API. The only preprocessing is replacing `{currentUser}` with the authenticated user's login. Claude generates these queries; they can use `search()`, direct repo lookups, or any valid GitHub GraphQL. This makes sections maximally flexible.
- `sort: { field, direction }` - current sort (client-side, applied after fetch)
- `collapsed: boolean`
- `order: number`
- `pollInterval: number` - seconds between auto-refreshes

**`SerializedDashboard`** - Top-level config:
- `version: number` - schema version for migrations
- `sections: SectionConfig[]`
- `settings: { globalRepoFilter, defaultPollInterval, theme }`

### Ephemeral (runtime only, not serialized)

**`NormalizedPR`** - Transformed from GraphQL response:
- Identity: `id`, `number`, `title`, `url`, `repo`
- State: `state` (OPEN/CLOSED/MERGED), `isDraft`
- Author: `{ login, avatarUrl }`
- Code: `additions`, `deletions`, `changedFiles`
- Reviews: `reviewDecision`, `reviewers[]` (login, avatar, state)
- CI: `ciState` (SUCCESS/FAILURE/PENDING), `ciChecks[]`
- Merge: `mergeable` (MERGEABLE/CONFLICTING/UNKNOWN)
- Meta: `labels[]`, `createdAt`, `updatedAt`, `isUnread`

---

## Component Architecture

### `PRSection` (key component)
- Receives `SectionConfig` as prop
- Calls `useSectionData(config)` hook internally - **each section fetches independently**
- Renders: `SectionHeader`, `ColumnHeaders`, `PRRow[]`
- Dispatches config updates (collapse, sort) to `DashboardContext`

### `PRRow` (key component)
- Single, self-contained presentational component - receives `NormalizedPR`, renders everything inline
- Renders: unread dot, author avatar, title + repo#number, CI status icon, review status + reviewer avatars, merge status, lines changed (+/-), relative updated time
- No sub-components - all rendering logic lives in one file for simplicity
- Clicking navigates to the PR on GitHub

### `useSectionData` hook (key hook)
- Takes `SectionConfig`, returns `{ prs, totalCount, isLoading, error, refresh }`
- Executes `config.query` as a raw GraphQL request (only preprocessing: replace `{currentUser}` placeholder)
- Passes response through `transforms.ts` to produce `NormalizedPR[]`
- Manages polling via `setInterval` based on `config.pollInterval`
- Aborts in-flight requests on unmount or config change
- Routes requests through a rate limiter (max 3 concurrent, 200ms minimum interval)

---

## GitHub API Strategy

Each section stores a **complete raw GraphQL query string**. The app does no query construction -- it just executes what's stored, after replacing `{currentUser}`. This means Claude (or any LLM) can generate arbitrarily complex queries for new sections without the app needing to understand them.

The transform layer (`transforms.ts`) normalizes whatever comes back into `NormalizedPR[]`. It expects PR nodes with the standard fields but gracefully handles missing ones (nulls/defaults).

### Default Section Queries (Graphite-style)

Each default section stores a **complete GraphQL query** — no GitHub search qualifier syntax involved. The app is purely a GraphQL client. Claude generates these queries against GitHub's GraphQL schema.

**Example: "Needs your review"**
```graphql
{
  search(query: "is:pr is:open review-requested:{currentUser}", type: ISSUE, first: 30) {
    issueCount
    nodes {
      ... on PullRequest {
        id number title url state isDraft
        additions deletions changedFiles mergeable reviewDecision
        createdAt updatedAt mergedAt
        author { login avatarUrl }
        repository { nameWithOwner }
        headRefName baseRefName
        labels(first: 10) { nodes { name color } }
        latestReviews(first: 10) { nodes { author { login avatarUrl } state } }
        reviewRequests(first: 10) { nodes { requestedReviewer { ... on User { login avatarUrl } } } }
        commits(last: 1) { nodes { commit { statusCheckRollup { state contexts(first: 25) { nodes { ... on CheckRun { name status conclusion } } } } } } }
      }
    }
  }
  rateLimit { remaining resetAt }
}
```

Note: the `search(query: "...")` parameter happens to use GitHub's search qualifier syntax internally, but that's just how the GraphQL `search` field works — it's not a separate abstraction we maintain. Sections could equally use `repository(owner:, name:) { pullRequests(...) }` or any other GraphQL entry point. The only contract is that the response contains PR nodes that `transforms.ts` can normalize into `NormalizedPR[]`.

**Default sections** (7 total, each with its own full GraphQL query):
1. Needs your review
2. Returned to you
3. Approved
4. Waiting for reviewers
5. Drafts
6. Waiting for author
7. Recently merged

### Unread Status
One global REST call to `GET /notifications?participating=true` on mount, builds a `Set<prUrl>`, shared via context. Refreshed every 5 minutes.

---

## Project Structure

```
lgtm/
├── manifest.json                    # Chrome extension manifest v3
├── package.json
├── tsconfig.json
├── vite.config.ts                   # Vite + CRXJS plugin
├── src/
│   ├── content/
│   │   └── index.ts                 # Content script: finds notification list, mounts React in Shadow DOM
│   ├── background/
│   │   └── service-worker.ts        # Minimal: badge updates, message relay
│   ├── app/
│   │   ├── App.tsx                  # Root: context providers, auth gate
│   │   ├── PRDashboard.tsx          # Maps sections -> PRSection components
│   │   ├── models/
│   │   │   ├── section.ts           # SectionConfig (query is a raw GraphQL string)
│   │   │   ├── pull-request.ts      # NormalizedPR, CIState, ReviewDecision
│   │   │   └── dashboard.ts         # SerializedDashboard, DashboardSettings
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Token provider (reads from chrome.storage)
│   │   │   ├── GitHubUserContext.tsx # Current user login
│   │   │   └── DashboardContext.tsx  # useReducer for section config CRUD + auto-persist
│   │   ├── hooks/
│   │   │   ├── useSectionData.ts    # Per-section data fetching + polling
│   │   │   ├── useSortedPRs.ts      # Client-side sort
│   │   │   └── useRelativeTime.ts   # "12h ago" formatting
│   │   ├── api/
│   │   │   ├── graphql-client.ts    # Thin fetch wrapper: sends raw query string, returns JSON
│   │   │   ├── transforms.ts        # Raw API response -> NormalizedPR (handles missing fields gracefully)
│   │   │   └── rate-limiter.ts      # Token-bucket request queue
│   │   ├── components/
│   │   │   ├── Section/
│   │   │   │   ├── PRSection.tsx
│   │   │   │   ├── SectionHeader.tsx
│   │   │   │   ├── ColumnHeaders.tsx
│   │   │   │   └── SectionSettings.tsx
│   │   │   ├── PRRow.tsx             # Single file: all PR row rendering logic
│   │   │   └── common/
│   │   │       ├── Avatar.tsx
│   │   │       ├── StatusIcon.tsx
│   │   │       └── Spinner.tsx
│   │   ├── defaults/
│   │   │   └── default-sections.ts  # 7 Graphite-style default section configs
│   │   └── storage/
│   │       └── persistence.ts       # chrome.storage.sync read/write (debounced)
│   └── shared/
│       └── messages.ts              # Message types for content <-> background
└── tests/
```

---

## Chrome Extension Integration

### Content Script (`src/content/index.ts`)
1. Runs on `github.com/notifications*` at `document_idle`
2. Reads current user from `<meta name="user-login">` tag
3. Finds the notification list container in the DOM
4. Creates a `<div id="lgtm-root">` with Shadow DOM
5. Mounts React app into the shadow root
6. Listens for GitHub's `turbo:load` events for SPA navigation

### Auth Flow
1. On first install: prompt user for GitHub PAT with `repo` + `notifications` scopes
2. Store in `chrome.storage.sync` (encrypted at rest by Chrome)
3. `AuthContext` loads token on mount, provides to all components
4. If no token, render a setup screen instead of the dashboard

---

## Implementation Sequence

1. **Scaffold extension** - `manifest.json`, Vite + CRXJS config, content script that logs on `/notifications`
2. **Types + defaults** - All model types in `models/`, default section configs
3. **Auth** - `AuthContext`, PAT storage, setup screen
4. **API layer** - GraphQL client, queries, rate limiter, transforms
5. **State management** - `DashboardContext` with reducer + persistence
6. **`useSectionData` hook** - Per-section fetching + polling
7. **Components** - `PRSection`, `PRRow` and sub-components
8. **Content script injection** - DOM targeting, Shadow DOM mount, style injection
9. **Polish** - Sorting, repo filter, section settings editor, unread dots

## Verification

1. Load extension in Chrome, navigate to `github.com/notifications`
2. Verify GitHub's left sidebar is untouched
3. Verify sections appear with correct PRs (cross-reference with Graphite)
4. Verify each section loads independently (staggered loading spinners)
5. Verify collapse/expand persists across page reload
6. Verify `chrome.storage.sync` contains serialized config (inspect via DevTools > Application > Storage)
7. Verify rate limiter works: add 7+ sections, confirm no 429 errors
8. Verify Shadow DOM isolation: GitHub styles don't leak in, our styles don't leak out
