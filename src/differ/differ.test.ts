import { diffEnvs, formatDiff } from './differ';
import { EnvSchema } from '../schema/types';

const schema: EnvSchema = {
  keys: {
    DATABASE_URL: { type: 'string', required: true },
    PORT: { type: 'number', required: true },
    DEBUG: { type: 'boolean', required: false },
  },
};

describe('diffEnvs', () => {
  it('returns no mismatches when all envs have all keys', () => {
    const envMaps = {
      development: { DATABASE_URL: 'postgres://localhost/dev', PORT: '5432', DEBUG: 'true' },
      production: { DATABASE_URL: 'postgres://prod/db', PORT: '5432', DEBUG: 'false' },
    };
    const result = diffEnvs(schema, envMaps);
    expect(result.hasMismatches).toBe(false);
    expect(result.hasMissing).toBe(false);
  });

  it('detects a key missing in one environment', () => {
    const envMaps = {
      development: { DATABASE_URL: 'postgres://localhost/dev', PORT: '5432', DEBUG: 'true' },
      production: { DATABASE_URL: 'postgres://prod/db', PORT: '5432' },
    };
    const result = diffEnvs(schema, envMaps);
    expect(result.hasMismatches).toBe(true);
    const debugEntry = result.entries.find((e) => e.key === 'DEBUG');
    expect(debugEntry).toBeDefined();
    expect(debugEntry?.missingIn).toContain('production');
    expect(debugEntry?.presentIn).toContain('development');
  });

  it('detects keys missing across all environments', () => {
    const envMaps = {
      development: { PORT: '3000' },
      staging: { PORT: '3000' },
    };
    const result = diffEnvs(schema, envMaps);
    const missingKey = result.entries.find((e) => e.key === 'DATABASE_URL');
    expect(missingKey?.missingIn).toContain('development');
    expect(missingKey?.missingIn).toContain('staging');
  });

  it('includes extra keys not in schema', () => {
    const envMaps = {
      development: { DATABASE_URL: 'x', PORT: '80', EXTRA_KEY: 'hello' },
      production: { DATABASE_URL: 'y', PORT: '80' },
    };
    const result = diffEnvs(schema, envMaps);
    const extraEntry = result.entries.find((e) => e.key === 'EXTRA_KEY');
    expect(extraEntry).toBeDefined();
    expect(extraEntry?.presentIn).toContain('development');
    expect(extraEntry?.missingIn).toContain('production');
  });
});

describe('formatDiff', () => {
  it('returns a message when no differences found', () => {
    const result = { entries: [], hasMismatches: false, hasMissing: false };
    expect(formatDiff(result)).toContain('No differences found');
  });

  it('includes mismatch key info in output', () => {
    const result = diffEnvs(schema, {
      dev: { DATABASE_URL: 'x', PORT: '5432' },
      prod: { DATABASE_URL: 'y', PORT: '5432', DEBUG: 'false' },
    });
    const output = formatDiff(result);
    expect(output).toContain('DEBUG');
    expect(output).toContain('dev');
  });
});
