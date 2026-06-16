import type { Logger, StorageClient } from '@ghpp/domain';
import { CONFIG_STORAGE_KEY, type PersistedConfig } from './config';
import { freshConfig, migrate } from './migrate';

export interface ConfigRepository {
  load(): Promise<PersistedConfig>;
  save(config: PersistedConfig): Promise<void>;
  /** Fires on cross-tab/host changes to the config. Returns unsubscribe. */
  subscribe(cb: (config: PersistedConfig) => void): () => void;
}

export function createConfigRepository(
  storage: StorageClient,
  options: { now?: () => string; logger?: Logger } = {},
): ConfigRepository {
  const now = options.now ?? (() => new Date().toISOString());
  const { logger } = options;

  return {
    async load() {
      const raw = await storage.get(CONFIG_STORAGE_KEY);
      return raw == null ? freshConfig(now()) : migrate(raw, now(), logger);
    },
    async save(config) {
      await storage.set<PersistedConfig>(CONFIG_STORAGE_KEY, { ...config, updatedAt: now() });
    },
    subscribe(cb) {
      return storage.watch(CONFIG_STORAGE_KEY, (value) => {
        if (value != null) cb(migrate(value, now(), logger));
      });
    },
  };
}
