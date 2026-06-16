import {
  CONTRACT_VERSION,
  type AuthInfo,
  type GitHubClient,
  type HostServices,
  type Logger,
  type NavigationEvents,
  type StorageClient,
  type ThemeInfo,
} from '@ghpp/domain';
import { fixturesByQuery } from './fixtures';

export interface MockThemeInfo extends ThemeInfo {
  /** Harness control to flip light/dark. */
  toggle(): void;
}

function memStorage(): StorageClient {
  const map = new Map<string, unknown>();
  const subs = new Map<string, Set<(v: unknown) => void>>();
  return {
    async get<T>(k: string) {
      return map.get(k) as T | undefined;
    },
    async set<T>(k: string, v: T) {
      map.set(k, v);
      subs.get(k)?.forEach((cb) => cb(v));
    },
    async remove(k: string) {
      map.delete(k);
      subs.get(k)?.forEach((cb) => cb(undefined));
    },
    watch<T>(k: string, cb: (v: T | undefined) => void) {
      let set = subs.get(k);
      if (!set) {
        set = new Set();
        subs.set(k, set);
      }
      set.add(cb as (v: unknown) => void);
      return () => subs.get(k)?.delete(cb as (v: unknown) => void);
    },
  };
}

const logger: Logger = {
  debug: (...a) => console.debug('[lgtm]', ...a),
  info: (...a) => console.info('[lgtm]', ...a),
  warn: (...a) => console.warn('[lgtm]', ...a),
  error: (...a) => console.error('[lgtm]', ...a),
  child: () => logger,
};

const auth: AuthInfo = {
  status: 'authenticated',
  user: {
    login: 'octocat',
    id: 1,
    name: 'The Octocat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    htmlUrl: 'https://github.com/octocat',
  },
  method: 'device-flow',
  scopes: ['repo', 'read:user'],
  subscribe: () => () => {},
};

const navigation: NavigationEvents = {
  current: () => ({ href: location.href, pathname: '/notifications', kind: 'notifications', params: {} }),
  onNavigate: () => () => {},
};

const github: GitHubClient = {
  graphql: (async (query: string, variables: Record<string, unknown> = {}) => {
    if (query.includes('query Counts')) {
      const out: Record<string, { issueCount: number }> = {};
      for (const key of Object.keys(variables)) {
        if (!key.startsWith('q')) continue;
        const q = String(variables[key]);
        out[`s${key.slice(1)}`] = { issueCount: (fixturesByQuery.get(q) ?? []).length };
      }
      return out;
    }
    if (query.includes('query Cards')) {
      const nodes = fixturesByQuery.get(String(variables.q)) ?? [];
      return { search: { issueCount: nodes.length, pageInfo: { hasNextPage: false, endCursor: null }, nodes } };
    }
    if (query.includes('query Preview')) {
      return { c: { issueCount: (fixturesByQuery.get(String(variables.q)) ?? []).length } };
    }
    return {};
  }) as GitHubClient['graphql'],
  rest: (async () => ({ data: {} })) as GitHubClient['rest'],
  searchIssues: (async () => ({ data: { total_count: 0, items: [] } })) as GitHubClient['searchIssues'],
};

function mockTheme(): MockThemeInfo {
  let mode: 'light' | 'dark' = 'light';
  const subs = new Set<(t: ThemeInfo) => void>();
  const theme: MockThemeInfo = {
    get mode() {
      return mode;
    },
    get githubTheme() {
      return mode;
    },
    subscribe(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    toggle() {
      mode = mode === 'light' ? 'dark' : 'light';
      subs.forEach((cb) => cb(theme));
    },
  };
  return theme;
}

export function createMockServices(): HostServices & { theme: MockThemeInfo } {
  return {
    github,
    storage: memStorage(),
    auth,
    navigation,
    theme: mockTheme(),
    logger,
    hostVersion: '0.0.0-dev',
    contractVersion: CONTRACT_VERSION,
  };
}
