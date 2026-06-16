import { describe, expect, it } from 'vitest';
import { CONFIG_VERSION } from './config';
import { freshConfig, migrate } from './migrate';

const NOW = '2025-01-01T00:00:00.000Z';

const validSection = {
  id: 's1',
  name: 'S',
  collapsed: false,
  badgeCount: true,
  query: { combinator: 'AND', conditions: [], scope: { orgs: [], repos: [] } },
};

describe('migrate', () => {
  it('falls back to defaults for null / non-object / missing sections', () => {
    expect(migrate(null, NOW).sections.length).toBeGreaterThan(0);
    expect(migrate(42, NOW).version).toBe(CONFIG_VERSION);
    expect(migrate({}, NOW).sections.length).toBeGreaterThan(0);
  });

  it('keeps valid sections and stamps the current version', () => {
    const result = migrate({ version: 1, sections: [validSection], updatedAt: NOW }, NOW);
    expect(result.version).toBe(CONFIG_VERSION);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.id).toBe('s1');
    expect(result.updatedAt).toBe(NOW);
  });

  it('drops invalid sections, falling back to defaults when none remain', () => {
    const result = migrate({ version: 1, sections: [{ id: 5 }, { name: 'no id' }] }, NOW);
    expect(result.sections[0]!.id).toBe('needs-your-review');
  });

  it('filters a mixed list, keeping the valid ones', () => {
    const result = migrate({ version: 1, sections: [validSection, { bogus: true }] }, NOW);
    expect(result.sections).toHaveLength(1);
  });

  it('freshConfig seeds defaults with the current version', () => {
    const f = freshConfig(NOW);
    expect(f.version).toBe(CONFIG_VERSION);
    expect(f.updatedAt).toBe(NOW);
    expect(f.sections.length).toBeGreaterThan(0);
  });
});
