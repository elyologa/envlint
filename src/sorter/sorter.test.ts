import { sortEnv, formatSortResult, SortResult } from './sorter';

const sampleEnv: Record<string, string> = {
  DB_HOST: 'localhost',
  APP_NAME: 'envlint',
  DB_PORT: '5432',
  APP_ENV: 'production',
  SECRET_KEY: 'abc123',
  ZEBRA: 'last',
};

describe('sortEnv', () => {
  it('sorts keys alphabetically by default', () => {
    const result = sortEnv(sampleEnv);
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
  });

  it('preserves all keys and values after sort', () => {
    const result = sortEnv(sampleEnv);
    expect(Object.keys(result)).toHaveLength(Object.keys(sampleEnv).length);
    for (const [k, v] of Object.entries(sampleEnv)) {
      expect(result[k]).toBe(v);
    }
  });

  it('groups by prefix when groupByPrefix is true', () => {
    const result = sortEnv(sampleEnv, { groupByPrefix: true });
    const keys = Object.keys(result);
    const appIdx = keys.findIndex(k => k.startsWith('APP_'));
    const dbIdx = keys.findIndex(k => k.startsWith('DB_'));
    const secretIdx = keys.findIndex(k => k.startsWith('SECRET_'));
    expect(appIdx).toBeLessThan(dbIdx);
    expect(dbIdx).toBeLessThan(secretIdx);
  });

  it('places keys without underscore prefix before grouped keys', () => {
    const env = { ZEBRA: 'z', APP_NAME: 'a', ALPHA: 'al' };
    const result = sortEnv(env, { groupByPrefix: true });
    const keys = Object.keys(result);
    expect(keys[0]).toBe('ALPHA');
    expect(keys[1]).toBe('ZEBRA');
  });

  it('is case-sensitive when caseSensitive is true', () => {
    const env = { b_KEY: '1', A_KEY: '2', a_KEY: '3' };
    const result = sortEnv(env, { caseSensitive: true });
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it('returns same order when alphabetical is false', () => {
    const result = sortEnv(sampleEnv, { alphabetical: false });
    expect(Object.keys(result)).toEqual(Object.keys(sampleEnv));
  });
});

describe('formatSortResult', () => {
  it('includes changed status when reordered', () => {
    const result: SortResult = {
      original: sampleEnv,
      sorted: sortEnv(sampleEnv),
      changed: true,
    };
    expect(formatSortResult(result)).toContain('reordered');
  });

  it('includes already sorted status when unchanged', () => {
    const sorted = sortEnv(sampleEnv);
    const result: SortResult = { original: sorted, sorted, changed: false };
    expect(formatSortResult(result)).toContain('already sorted');
  });

  it('includes output path when provided', () => {
    const result: SortResult = {
      original: sampleEnv,
      sorted: sortEnv(sampleEnv),
      changed: true,
      outputPath: '/tmp/.env.sorted',
    };
    expect(formatSortResult(result)).toContain('/tmp/.env.sorted');
  });
});
