import { createStore, type StoreApi } from 'zustand/vanilla';
import type { HostServices } from '@ghpp/domain';
import type { SectionConfig } from '../query/model';
import { CONFIG_VERSION } from '../persistence/config';
import { createConfigRepository } from '../persistence/repository';

export interface LgtmUiState {
  focusedSectionId: string | null;
  editorOpenFor: string | null;
}

export interface LgtmState {
  loaded: boolean;
  sections: SectionConfig[];
  ui: LgtmUiState;

  load(): Promise<void>;
  reorder(from: number, to: number): void;
  setCollapsed(id: string, collapsed: boolean): void;
  upsertSection(section: SectionConfig): void;
  removeSection(id: string): void;
  focusSection(id: string | null): void;
  openEditor(id: string | null): void;
}

export type LgtmStore = StoreApi<LgtmState>;

export interface LgtmStoreHandle {
  store: LgtmStore;
  dispose(): void;
}

/**
 * Vanilla zustand store shared by both surfaces (sidebar + main) so they stay
 * in sync. Mutations persist (debounced) through the config repository; external
 * config changes are adopted via the repository subscription.
 */
export function createLgtmStore(services: HostServices): LgtmStoreHandle {
  const repo = createConfigRepository(services.storage, {
    logger: services.logger.child('config'),
  });

  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const store = createStore<LgtmState>((set, get) => {
    const persist = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        void repo.save({ version: CONFIG_VERSION, sections: get().sections, updatedAt: '' });
      }, 300);
    };

    return {
      loaded: false,
      sections: [],
      ui: { focusedSectionId: null, editorOpenFor: null },

      async load() {
        const config = await repo.load();
        set({ sections: config.sections, loaded: true });
      },

      reorder(from, to) {
        set({ sections: arrayMove(get().sections, from, to) });
        persist();
      },

      setCollapsed(id, collapsed) {
        set({ sections: get().sections.map((s) => (s.id === id ? { ...s, collapsed } : s)) });
        persist();
      },

      upsertSection(section) {
        const sections = get().sections;
        const idx = sections.findIndex((s) => s.id === section.id);
        set({
          sections:
            idx >= 0 ? sections.map((s) => (s.id === section.id ? section : s)) : [...sections, section],
        });
        persist();
      },

      removeSection(id) {
        set({ sections: get().sections.filter((s) => s.id !== id) });
        persist();
      },

      focusSection(id) {
        set({ ui: { ...get().ui, focusedSectionId: id } });
      },

      openEditor(id) {
        set({ ui: { ...get().ui, editorOpenFor: id } });
      },
    };
  });

  // Adopt external (other tab/host) config changes. setState here triggers no
  // action, so there's no persist feedback loop.
  const off = repo.subscribe((config) => store.setState({ sections: config.sections }));

  return {
    store,
    dispose() {
      if (saveTimer) clearTimeout(saveTimer);
      off();
    },
  };
}

function arrayMove<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}
