import type { Logger } from '@ghpp/domain';
import type { SectionConfig } from '../query/model';
import { defaultSections } from '../query/defaults';
import { CONFIG_VERSION, type PersistedConfig } from './config';

/** A brand-new config seeded with the default sections. */
export function freshConfig(now: string): PersistedConfig {
  return { version: CONFIG_VERSION, sections: defaultSections(), updatedAt: now };
}

/**
 * Validate + up-migrate a raw persisted value into a valid PersistedConfig.
 * Unknown shapes or fully-invalid sections fall back to defaults rather than
 * crashing the page. Future schema bumps add version-keyed transforms here.
 */
export function migrate(raw: unknown, now: string, logger?: Logger): PersistedConfig {
  if (!isRecord(raw) || !Array.isArray(raw.sections)) {
    return freshConfig(now);
  }

  // (no version-specific migrations yet; v1 is the initial schema)

  const sections = raw.sections.filter(isValidSection);
  if (sections.length === 0) {
    logger?.warn('persisted config had no valid sections; using defaults');
    return freshConfig(now);
  }

  return {
    version: CONFIG_VERSION,
    sections,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isValidSection(v: unknown): v is SectionConfig {
  if (!isRecord(v)) return false;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return false;
  if (!isRecord(v.query)) return false;
  const { combinator, conditions, scope } = v.query;
  if (combinator !== 'AND' && combinator !== 'OR') return false;
  if (!Array.isArray(conditions)) return false;
  if (!isRecord(scope) || !Array.isArray(scope.orgs) || !Array.isArray(scope.repos)) return false;
  return true;
}
