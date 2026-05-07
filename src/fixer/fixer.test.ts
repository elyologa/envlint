import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fixEnvFile, formatFixResult, getPlaceholderValue } from './fixer';
import { EnvSchema } from '../schema/types';
import { ValidationResult } from '../schema/validator';

const schema: EnvSchema = {
  fields: {
    API_KEY: { type: 'string', required: true, description: 'API key for service' },
    PORT: { type: 'number', required: true, example: '3000' },
    DEBUG: { type: 'boolean', required: false },
    BASE_URL: { type: 'url', required: true },
  },
};

const validationResult: ValidationResult = {
  valid: false,
  errors: [
    { key: 'API_KEY', type: 'missing', message: 'Missing required key: API_KEY' },
    { key: 'PORT', type: 'missing', message: 'Missing required key: PORT' },
  ],
};

describe('getPlaceholderValue', () => {
  it('returns example when provided', () => {
    expect(getPlaceholderValue('number', '8080')).toBe('8080');
  });
  it('returns 0 for number type', () => {
    expect(getPlaceholderValue('number')).toBe('0');
  });
  it('returns false for boolean type', () => {
    expect(getPlaceholderValue('boolean')).toBe('false');
  });
  it('returns placeholder url for url type', () => {
    expect(getPlaceholderValue('url')).toBe('https://example.com');
  });
  it('returns CHANGE_ME for unknown types', () => {
    expect(getPlaceholderValue('string')).toBe('CHANGE_ME');
  });
});

describe('fixEnvFile', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `.env.test.${Date.now()}`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('appends missing keys with placeholders', () => {
    fs.writeFileSync(tmpFile, 'EXISTING=value\n', 'utf-8');
    const result = fixEnvFile(tmpFile, schema, validationResult);
    expect(result.addedKeys).toEqual(['API_KEY', 'PORT']);
    const content = fs.readFileSync(tmpFile, 'utf-8');
    expect(content).toContain('API_KEY=CHANGE_ME');
    expect(content).toContain('PORT=3000');
    expect(content).toContain('EXISTING=value');
  });

  it('does not write file in dry run mode', () => {
    const result = fixEnvFile(tmpFile, schema, validationResult, true);
    expect(result.addedKeys).toEqual(['API_KEY', 'PORT']);
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it('returns empty added keys when no errors', () => {
    const result = fixEnvFile(tmpFile, schema, { valid: true, errors: [] });
    expect(result.addedKeys).toHaveLength(0);
  });
});

describe('formatFixResult', () => {
  it('formats added keys correctly', () => {
    const result = { filePath: '.env', addedKeys: ['API_KEY', 'PORT'], skippedKeys: [] };
    const output = formatFixResult(result);
    expect(output).toContain('Added (2): API_KEY, PORT');
  });

  it('includes DRY RUN prefix when dryRun is true', () => {
    const result = { filePath: '.env', addedKeys: ['API_KEY'], skippedKeys: [] };
    expect(formatFixResult(result, true)).toContain('[DRY RUN]');
  });

  it('shows no changes message when nothing to fix', () => {
    const result = { filePath: '.env', addedKeys: [], skippedKeys: [] };
    expect(formatFixResult(result)).toContain('No changes needed');
  });
});
