import { lintEnv, formatLintResult } from './linter';
import { EnvSchema } from '../schema/types';

const schema: EnvSchema = {
  DATABASE_URL: { type: 'string', required: true },
  PORT: { type: 'number', required: false },
  DEBUG: { type: 'boolean', required: false },
  LOG_LEVEL: { type: 'string', required: true, allowedValues: ['debug', 'info', 'warn', 'error'] },
  API_KEY: { type: 'string', required: true, pattern: '^[A-Za-z0-9]{32}$' },
};

describe('lintEnv', () => {
  it('passes with valid env', () => {
    const env = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: '3000',
      DEBUG: 'true',
      LOG_LEVEL: 'info',
      API_KEY: 'a'.repeat(32),
    };
    const result = lintEnv(env, schema, '.env');
    expect(result.valid).toBe(true);
    expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
  });

  it('reports missing required key as error', () => {
    const env = { PORT: '3000', DEBUG: 'false', LOG_LEVEL: 'debug', API_KEY: 'a'.repeat(32) };
    const result = lintEnv(env, schema, '.env');
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.key === 'DATABASE_URL' && i.severity === 'error')).toBe(true);
  });

  it('reports invalid number type as error', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db', PORT: 'not-a-number', LOG_LEVEL: 'info', API_KEY: 'a'.repeat(32) };
    const result = lintEnv(env, schema, '.env');
    expect(result.issues.some(i => i.key === 'PORT' && i.severity === 'error')).toBe(true);
  });

  it('reports invalid boolean type as error', () => {
    const env = { DATABASE_URL: 'url', PORT: '80', DEBUG: 'yes', LOG_LEVEL: 'info', API_KEY: 'a'.repeat(32) };
    const result = lintEnv(env, schema, '.env');
    expect(result.issues.some(i => i.key === 'DEBUG' && i.severity === 'error')).toBe(true);
  });

  it('reports disallowed value as error', () => {
    const env = { DATABASE_URL: 'url', LOG_LEVEL: 'verbose', API_KEY: 'a'.repeat(32) };
    const result = lintEnv(env, schema, '.env');
    expect(result.issues.some(i => i.key === 'LOG_LEVEL' && i.severity === 'error')).toBe(true);
  });

  it('reports pattern mismatch as error', () => {
    const env = { DATABASE_URL: 'url', LOG_LEVEL: 'info', API_KEY: 'short' };
    const result = lintEnv(env, schema, '.env');
    expect(result.issues.some(i => i.key === 'API_KEY' && i.severity === 'error')).toBe(true);
  });

  it('warns about undeclared keys', () => {
    const env = { DATABASE_URL: 'url', LOG_LEVEL: 'info', API_KEY: 'a'.repeat(32), UNKNOWN_VAR: 'x' };
    const result = lintEnv(env, schema, '.env');
    expect(result.issues.some(i => i.key === 'UNKNOWN_VAR' && i.severity === 'warn')).toBe(true);
  });
});

describe('formatLintResult', () => {
  it('shows PASS for valid result', () => {
    const result = { file: '.env', issues: [], valid: true };
    expect(formatLintResult(result)).toContain('PASS');
    expect(formatLintResult(result)).toContain('No issues found');
  });

  it('shows FAIL and issues for invalid result', () => {
    const result = {
      file: '.env',
      issues: [{ key: 'FOO', severity: 'error' as const, message: 'Missing required key: FOO' }],
      valid: false,
    };
    const output = formatLintResult(result);
    expect(output).toContain('FAIL');
    expect(output).toContain('ERROR');
    expect(output).toContain('FOO');
  });
});
