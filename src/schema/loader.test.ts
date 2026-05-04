import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';
import { loadSchema, loadEnvFile } from './loader';

const TMP = resolve(__dirname, '__tmp_loader_test__');

beforeAll(() => {
  mkdirSync(TMP, { recursive: true });

  writeFileSync(
    resolve(TMP, 'valid.schema.json'),
    JSON.stringify({ PORT: { type: 'number', required: true }, APP: { type: 'string' } })
  );

  writeFileSync(
    resolve(TMP, 'invalid.schema.json'),
    JSON.stringify({ PORT: { required: true } })
  );

  writeFileSync(
    resolve(TMP, 'sample.env'),
    `# comment\nPORT=3000\nAPP="my-app"\nDEBUG=true\n`
  );
});

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('loadSchema', () => {
  it('loads a valid schema file', () => {
    const schema = loadSchema(resolve(TMP, 'valid.schema.json'));
    expect(schema.PORT.type).toBe('number');
    expect(schema.APP.type).toBe('string');
  });

  it('throws when schema file is missing', () => {
    expect(() => loadSchema(resolve(TMP, 'nonexistent.json'))).toThrow('Schema file not found');
  });

  it('throws when schema entry has no type', () => {
    expect(() => loadSchema(resolve(TMP, 'invalid.schema.json'))).toThrow("invalid or missing 'type'");
  });
});

describe('loadEnvFile', () => {
  it('parses key-value pairs correctly', () => {
    const env = loadEnvFile(resolve(TMP, 'sample.env'));
    expect(env.PORT).toBe('3000');
    expect(env.APP).toBe('my-app');
    expect(env.DEBUG).toBe('true');
  });

  it('ignores comments and blank lines', () => {
    const env = loadEnvFile(resolve(TMP, 'sample.env'));
    expect(Object.keys(env)).not.toContain('');
  });

  it('throws when env file is missing', () => {
    expect(() => loadEnvFile(resolve(TMP, 'missing.env'))).toThrow('Env file not found');
  });
});
