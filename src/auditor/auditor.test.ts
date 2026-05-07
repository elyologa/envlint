import { auditEnv, formatAuditResult } from './auditor';
import { EnvSchema } from '../schema/types';

const schema: EnvSchema = {
  DATABASE_URL: { type: 'url', required: true },
  PORT: { type: 'number', required: false },
  DEBUG: { type: 'boolean', required: false },
  API_KEY: { type: 'string', required: true, pattern: '^[A-Za-z0-9]{16,}$' },
};

describe('auditEnv', () => {
  it('returns no issues for a valid env', () => {
    const env = {
      DATABASE_URL: 'https://db.example.com',
      PORT: '3000',
      DEBUG: 'true',
      API_KEY: 'abcdefghijklmnop',
    };
    const result = auditEnv('.env', env, schema);
    expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    expect(result.score).toBe(100);
  });

  it('reports error for missing required key', () => {
    const env = { PORT: '3000' };
    const result = auditEnv('.env', env, schema);
    const errors = result.issues.filter(i => i.severity === 'error');
    expect(errors.some(e => e.key === 'DATABASE_URL')).toBe(true);
    expect(errors.some(e => e.key === 'API_KEY')).toBe(true);
  });

  it('reports info for missing optional key', () => {
    const env = { DATABASE_URL: 'https://db.example.com', API_KEY: 'abcdefghijklmnop' };
    const result = auditEnv('.env', env, schema);
    const infos = result.issues.filter(i => i.severity === 'info');
    expect(infos.some(i => i.key === 'PORT')).toBe(true);
  });

  it('reports error for invalid URL', () => {
    const env = { DATABASE_URL: 'not-a-url', API_KEY: 'abcdefghijklmnop' };
    const result = auditEnv('.env', env, schema);
    expect(result.issues.some(i => i.key === 'DATABASE_URL' && i.severity === 'error')).toBe(true);
  });

  it('reports error for invalid number', () => {
    const env = { DATABASE_URL: 'https://db.example.com', PORT: 'abc', API_KEY: 'abcdefghijklmnop' };
    const result = auditEnv('.env', env, schema);
    expect(result.issues.some(i => i.key === 'PORT' && i.severity === 'error')).toBe(true);
  });

  it('reports warning for undeclared keys', () => {
    const env = { DATABASE_URL: 'https://db.example.com', API_KEY: 'abcdefghijklmnop', UNKNOWN_KEY: 'value' };
    const result = auditEnv('.env', env, schema);
    expect(result.issues.some(i => i.key === 'UNKNOWN_KEY' && i.severity === 'warning')).toBe(true);
  });

  it('reports error for pattern mismatch', () => {
    const env = { DATABASE_URL: 'https://db.example.com', API_KEY: 'short' };
    const result = auditEnv('.env', env, schema);
    expect(result.issues.some(i => i.key === 'API_KEY' && i.severity === 'error')).toBe(true);
  });
});

describe('formatAuditResult', () => {
  it('shows no issues message when clean', () => {
    const result = { file: '.env', issues: [], score: 100 };
    expect(formatAuditResult(result)).toContain('No issues found');
  });

  it('includes score in output', () => {
    const result = { file: '.env.staging', issues: [], score: 85 };
    expect(formatAuditResult(result)).toContain('85/100');
  });

  it('formats issues with severity icons', () => {
    const result = {
      file: '.env',
      issues: [{ key: 'FOO', severity: 'error' as const, message: 'Missing required key: FOO' }],
      score: 80,
    };
    const output = formatAuditResult(result);
    expect(output).toContain('[ERROR]');
    expect(output).toContain('Missing required key: FOO');
  });
});
