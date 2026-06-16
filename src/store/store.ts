import { createStore, type StoreApi } from 'zustand/vanilla';
import type { HostServices } from '@ghpp/domain';
import type { SectionConfig } from '../query/model';
import { compileToSearches } from '../query/compile';
import { CONFIG_VERSION } from '../persistence/config';
import { createConfigRepository } from '../persistence/repository';
import {
  CARDS_QUERY,
  buildCountsQuery,
  parseCards,
  parseCounts,
  type PrCardData,
} from '../data/gql';

const CARDS_PAGE_SIZE = 25;

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface CountState {
  status: LoadStatus;
  value?: number;
}

export interface CardsState {
  status: LoadStatus;
  nodes: PrCardData[];
  issueCount?: number;
  error?: string;
  fetchedAt?: number;
}

export interface LgtmUiState {
  focusedSectionId: string | null;
  editorOpenFor: string | null;
}

export interface LgtmState {
  loaded: boolean;
  sections: SectionConfig[];
  counts: Record<string, CountState>;
  cards: Record<string, CardsState>;
  ui: LgtmUiState;

  load(): Promise<void>;
  reorder(from: number, to: number): void;
  setCollapsed(id: string, collapsed: boolean): void;
  upsertSection(section: SectionConfig): void;
  removeSection(id: string): void;
  focusSection(id: string | null): void;
  openEditor(id: string | null): void;

  refreshCounts(): Promise<void>;
  refreshCards(id: string): Promise<void>;
  refreshVisible(): Promise<void>;
}

export type LgtmStore = StoreApi<LgtmState>;

export interface LgtmStoreHandle {
  store: LgtmStore;
  dispose(): void;
}

export function createLgtmStore(services: HostServices): LgtmStoreHandle {
  const { github, logger } = services;
  const repo = createConfigRepository(services.storage, { logger: logger.child('config') });
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const store = createStore<LgtmState>((set, get) => {
    const persist = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        void repo.save({ version: CONFIG_VERSION, sections: get().sections, updatedAt: '' });
      }, 300);
    };

    const patchCards = (id: string, patch: Partial<CardsState>) => {
      const prev = get().cards[id] ?? { status: 'idle', nodes: [] };
      set({ cards: { ...get().cards, [id]: { ...prev, ...patch } } });
    };

    return {
      loaded: false,
      sections: [],
      counts: {},
      cards: {},
      ui: { focusedSectionId: null, editorOpenFor: null },

      async load() {
        const config = await repo.load();
        set({ sections: config.sections, loaded: true });
        void get().refreshVisible();
      },

      reorder(from, to) {
        set({ sections: arrayMove(get().sections, from, to) });
        persist();
      },

      setCollapsed(id, collapsed) {
        set({ sections: get().sections.map((s) => (s.id === id ? { ...s, collapsed } : s)) });
        persist();
        if (!collapsed && (get().cards[id]?.status ?? 'idle') === 'idle') {
          void get().refreshCards(id);
        }
      },

      upsertSection(section) {
        const sections = get().sections;
        const idx = sections.findIndex((s) => s.id === section.id);
        set({
          sections:
            idx >= 0
              ? sections.map((s) => (s.id === section.id ? section : s))
              : [...sections, section],
        });
        persist();
        void get().refreshCounts();
        if (!section.collapsed) void get().refreshCards(section.id);
      },

      removeSection(id) {
        const { [id]: _c, ...counts } = get().counts;
        const { [id]: _d, ...cards } = get().cards;
        set({ sections: get().sections.filter((s) => s.id !== id), counts, cards });
        persist();
      },

      focusSection(id) {
        set({ ui: { ...get().ui, focusedSectionId: id } });
      },

      openEditor(id) {
        set({ ui: { ...get().ui, editorOpenFor: id } });
      },

      async refreshCounts() {
        const built = buildCountsQuery(get().sections);
        if (!built) return;
        const ids = Object.values(built.aliasToId);
        set({ counts: markCounts(get().counts, ids, 'loading') });
        try {
          const data = await github.graphql<Record<string, { issueCount?: number } | null>>(
            built.query,
            built.variables,
          );
          const values = parseCounts(data, built.aliasToId);
          const next = { ...get().counts };
          for (const id of ids) {
            next[id] = { status: 'ready', value: values[id] ?? 0 };
          }
          set({ counts: next });
        } catch (err) {
          logger.error('refreshCounts failed', err);
          set({ counts: markCounts(get().counts, ids, 'error') });
        }
      },

      async refreshCards(id) {
        const section = get().sections.find((s) => s.id === id);
        if (!section) return;
        patchCards(id, { status: 'loading', error: undefined });
        try {
          const searches = compileToSearches(section.query);
          const byId = new Map<string, PrCardData>();
          let issueCount = 0;
          for (const q of searches) {
            const res = await github.graphql<{ search: unknown }>(CARDS_QUERY, {
              q,
              first: CARDS_PAGE_SIZE,
              after: null,
            });
            const parsed = parseCards(res.search);
            issueCount = searches.length === 1 ? parsed.issueCount : issueCount;
            for (const node of parsed.nodes) byId.set(node.id, node);
          }
          const nodes = [...byId.values()].slice(0, CARDS_PAGE_SIZE);
          patchCards(id, {
            status: 'ready',
            nodes,
            issueCount: searches.length === 1 ? issueCount : nodes.length,
            fetchedAt: Date.now(),
          });
        } catch (err) {
          logger.error(`refreshCards(${id}) failed`, err);
          patchCards(id, { status: 'error', error: err instanceof Error ? err.message : String(err) });
        }
      },

      async refreshVisible() {
        await get().refreshCounts();
        const expanded = get().sections.filter((s) => !s.collapsed);
        await Promise.all(expanded.map((s) => get().refreshCards(s.id)));
      },
    };
  });

  const off = repo.subscribe((config) => store.setState({ sections: config.sections }));

  return {
    store,
    dispose() {
      if (saveTimer) clearTimeout(saveTimer);
      off();
    },
  };
}

function markCounts(
  counts: Record<string, CountState>,
  ids: string[],
  status: LoadStatus,
): Record<string, CountState> {
  const next = { ...counts };
  for (const id of ids) next[id] = { ...next[id], status };
  return next;
}

function arrayMove<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}
