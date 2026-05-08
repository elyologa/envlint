import {
  isSensitiveKey,
  maskValue,
  redactEnv,
  formatRedactResult,
} from './redactor';

const DEFAULT_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /passphrase/i,
];

describe('isSensitiveKey', () => {
  it('detects password keys', () => {
    expect(isSensitiveKey('DB_PASSWORD', DEFAULT_PATTERNS)).toBe(true);
  });

  it('detects token keys', () => {
    expect(isSensitiveKey('API_TOKEN', DEFAULT_PATTERNS)).toBe(true);
  });

  it('detects api_key keys', () => {
    expect(isSensitiveKey('STRIPE_API_KEY', DEFAULT_PATTERNS)).toBe(true);
  });

  it('returns false for non-sensitive keys', () => {
    expect(isSensitiveKey('APP_PORT', DEFAULT_PATTERNS)).toBe(false);
    expect(isSensitiveKey('NODE_ENV', DEFAULT_PATTERNS)).toBe(false);
  });
});

describe('maskValue', () => {
  it('masks value leaving last 4 chars visible', () => {
    expect(maskValue('supersecret1234')).toBe('***********1234');
  });

  it('fully masks short values', () => {
    expect(maskValue('abc')).toBe('***');
  });

  it('respects custom maskChar and visibleChars', () => {
    expect(maskValue('abcdefgh', '#', 2)).toBe('######gh');
  });
});

describe('redactEnv', () => {
  const env = {
    APP_NAME: 'myapp',
    DB_PASSWORD: 'supersecret',
    API_TOKEN: 'tok_live_abc123',
    PORT: '3000',
  };

  it('redacts sensitive keys and leaves others intact', () => {
    const result = redactEnv(env);
    expect(result.redacted['APP_NAME']).toBe('myapp');
    expect(result.redacted['PORT']).toBe('3000');
    expect(result.redacted['DB_PASSWORD']).not.toBe('supersecret');
    expect(result.redacted['API_TOKEN']).not.toBe('tok_live_abc123');
  });

  it('tracks redacted keys', () => {
    const result = redactEnv(env);
    expect(result.redactedKeys).toContain('DB_PASSWORD');
    expect(result.redactedKeys).toContain('API_TOKEN');
    expect(result.redactedKeys).not.toContain('APP_NAME');
  });

  it('returns empty redactedKeys when no sensitive values', () => {
    const result = redactEnv({ APP_NAME: 'myapp', PORT: '8080' });
    expect(result.redactedKeys).toHaveLength(0);
  });
});

describe('formatRedactResult', () => {
  it('formats result with redacted keys', () => {
    const result = redactEnv({ DB_PASSWORD: 'secret123' });
    const output = formatRedactResult(result);
    expect(output).toContain('Redacted 1 sensitive key(s)');
    expect(output).toContain('DB_PASSWORD');
  });

  it('shows none when no keys redacted', () => {
    const result = redactEnv({ PORT: '3000' });
    const output = formatRedactResult(result);
    expect(output).toContain('(none found)');
  });
});
