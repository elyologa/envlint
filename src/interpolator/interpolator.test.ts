import {
  interpolateValue,
  interpolateEnv,
  formatInterpolationResult,
} from './interpolator';

describe('interpolateValue', () => {
  it('resolves a single reference', () => {
    const result = interpolateValue('URL', 'https://${HOST}/api', { HOST: 'example.com' });
    expect(result.resolved).toBe('https://example.com/api');
    expect(result.missing).toHaveLength(0);
  });

  it('resolves multiple references in one value', () => {
    const result = interpolateValue('DSN', '${SCHEME}://${HOST}:${PORT}', {
      SCHEME: 'postgres',
      HOST: 'localhost',
      PORT: '5432',
    });
    expect(result.resolved).toBe('postgres://localhost:5432');
    expect(result.missing).toHaveLength(0);
  });

  it('tracks missing references', () => {
    const result = interpolateValue('URL', 'https://${HOST}/api', {});
    expect(result.resolved).toBe('https://${HOST}/api');
    expect(result.missing).toContain('HOST');
  });

  it('returns original when no references present', () => {
    const result = interpolateValue('NAME', 'myapp', { HOST: 'x' });
    expect(result.resolved).toBe('myapp');
    expect(result.original).toBe('myapp');
    expect(result.missing).toHaveLength(0);
  });
});

describe('interpolateEnv', () => {
  it('resolves cross-references across env entries', () => {
    const env = { HOST: 'localhost', PORT: '3000', URL: 'http://${HOST}:${PORT}' };
    const result = interpolateEnv(env);
    const urlEntry = result.entries.find((e) => e.key === 'URL')!;
    expect(urlEntry.resolved).toBe('http://localhost:3000');
    expect(result.hasUnresolved).toBe(false);
  });

  it('flags hasUnresolved when a reference is missing', () => {
    const env = { URL: 'http://${MISSING_HOST}/path' };
    const result = interpolateEnv(env);
    expect(result.hasUnresolved).toBe(true);
    expect(result.entries[0].missing).toContain('MISSING_HOST');
  });

  it('returns empty entries for empty env', () => {
    const result = interpolateEnv({});
    expect(result.entries).toHaveLength(0);
    expect(result.hasUnresolved).toBe(false);
  });
});

describe('formatInterpolationResult', () => {
  it('shows resolved message when references exist', () => {
    const result = interpolateEnv({ HOST: 'localhost', URL: 'http://${HOST}' });
    const output = formatInterpolationResult(result);
    expect(output).toContain('[RESOLVED]');
    expect(output).toContain('URL');
  });

  it('shows unresolved message when missing refs', () => {
    const result = interpolateEnv({ URL: 'http://${GHOST}' });
    const output = formatInterpolationResult(result);
    expect(output).toContain('[UNRESOLVED]');
    expect(output).toContain('GHOST');
  });

  it('returns no-reference message when nothing to interpolate', () => {
    const result = interpolateEnv({ NAME: 'envlint', VERSION: '1.0.0' });
    const output = formatInterpolationResult(result);
    expect(output).toBe('No interpolation references found.');
  });
});
