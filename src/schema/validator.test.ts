import { describe, it, expect } from 'vitest';
import { validate } from './validator';
import type { EnvSchema } from './types';

const schema: EnvSchema = {
  PORT: { type: 'number', required: true },
  DEBUG: { type: 'boolean', required: false, default: 'false' },
  DATABASE_URL: { type: 'url', required: true },
  ADMIN_EMAIL: { type: 'email', required: false },
  APP_NAME: { type: 'string', required: true, pattern: '^[a-z-]+$' },
};

describe('validate', () => {
  it('returns valid for a correct env', () => {
    const env = {
      PORT: '3000',
      DATABASE_URL: 'https://db.example.com',
      APP_NAME: 'my-app',
    };
    const result = validate(env, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports missing required keys', () => {
    const result = validate({ APP_NAME: 'my-app' }, schema);
    expect(result.valid).toBe(false);
    const keys = result.errors.map((e) => e.key);
    expect(keys).toContain('PORT');
    expect(keys).toContain('DATABASE_URL');
  });

  it('reports type mismatch for number', () => {
    const env = { PORT: 'not-a-number', DATABASE_URL: 'https://db.example.com', APP_NAME: 'my-app' };
    const result = validate(env, schema);
    const portError = result.errors.find((e) => e.key === 'PORT');
    expect(portError?.type).toBe('type_mismatch');
  });

  it('reports pattern mismatch', () => {
    const env = { PORT: '3000', DATABASE_URL: 'https://db.example.com', APP_NAME: 'My App' };
    const result = validate(env, schema);
    const nameError = result.errors.find((e) => e.key === 'APP_NAME');
    expect(nameError?.type).toBe('pattern_mismatch');
  });

  it('warns about extra keys', () => {
    const env = { PORT: '3000', DATABASE_URL: 'https://db.example.com', APP_NAME: 'my-app', UNKNOWN: 'value' };
    const result = validate(env, schema);
    const warning = result.warnings.find((w) => w.key === 'UNKNOWN');
    expect(warning?.type).toBe('extra_key');
  });

  it('warns when using default value', () => {
    const env = { PORT: '3000', DATABASE_URL: 'https://db.example.com', APP_NAME: 'my-app' };
    const result = validate(env, schema);
    const warning = result.warnings.find((w) => w.key === 'DEBUG');
    expect(warning?.type).toBe('using_default');
  });

  it('validates email type correctly', () => {
    const env = { PORT: '3000', DATABASE_URL: 'https://db.example.com', APP_NAME: 'my-app', ADMIN_EMAIL: 'bad-email' };
    const result = validate(env, schema);
    const emailError = result.errors.find((e) => e.key === 'ADMIN_EMAIL');
    expect(emailError?.type).toBe('type_mismatch');
  });
});
