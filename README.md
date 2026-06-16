# lgtm

A Graphite-style pull-request inbox for GitHub, packaged as a **host-agnostic
React library**. It renders a "GitHub++" sidebar nav (with live PR counts) and a
drag-and-drop, query-backed inbox. It knows nothing about Chrome or auth — it
only consumes injected service clients (`@ghpp/domain`) and a Shadow DOM mount
point, so any host can run it.

Part of the [GitHub++ (ghpp)](https://github.com/Guptologie) extension; consumed
there as a git submodule.

## Public API

`createLgtm(services)` returns an `ActiveLibrary` that mounts the `sidebar` and
`main` slots (sharing one store so they stay in sync). The default export is a
`LibraryModule` matching `github.com/notifications`.

```ts
import lgtm, { createLgtm } from '@ghpp/lgtm';
```

## Develop standalone

```bash
pnpm install
pnpm dev     # Vite dev harness: both slots in real shadow roots, mock services
pnpm test    # query compiler + config migration unit tests
pnpm build   # ESM library (host-provided deps externalized)
```

The harness (`src/dev`) mounts lgtm exactly like the host would, against mock
services with fixture PRs — no Chrome, no token. Includes a light/dark toggle.

## Layout

```
src/index.tsx        public entry (createLgtm + LibraryModule)
src/app              provider stack (theme bridge, shadow portals), surfaces
src/components       inbox (dnd sections, PR cards), sidebar, section editor
src/query            structured filter model + GitHub-search compiler
src/data             batched GraphQL (aliased counts + PR cards), polling
src/persistence      versioned config + StorageClient repository
src/store            shared zustand store
src/dev              standalone harness + mock services + fixtures
```
