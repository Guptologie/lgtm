import type { SectionConfig } from '../query/model';

export const CONFIG_VERSION = 1 as const;

/** Key within the library's namespaced StorageClient. */
export const CONFIG_STORAGE_KEY = 'config';

export interface PersistedConfig {
  version: number;
  /** Ordered; array order is the display order. */
  sections: SectionConfig[];
  /** ISO timestamp of the last write (last-write-wins on cross-tab merge). */
  updatedAt: string;
}
