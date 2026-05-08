import { EnvRecord } from '../schema/types';

export interface RedactOptions {
  maskChar?: string;
  visibleChars?: number;
  patterns?: RegExp[];
}

export interface RedactResult {
  original: EnvRecord;
  redacted: EnvRecord;
  redactedKeys: string[];
}

const DEFAULT_SENSITIVE_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /passphrase/i,
];

export function isSensitiveKey(key: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(key));
}

export function maskValue(
  value: string,
  maskChar: string = '*',
  visibleChars: number = 4
): string {
  if (value.length <= visibleChars) {
    return maskChar.repeat(value.length);
  }
  const masked = maskChar.repeat(value.length - visibleChars);
  return masked + value.slice(-visibleChars);
}

export function redactEnv(
  env: EnvRecord,
  options: RedactOptions = {}
): RedactResult {
  const {
    maskChar = '*',
    visibleChars = 4,
    patterns = DEFAULT_SENSITIVE_PATTERNS,
  } = options;

  const redacted: EnvRecord = {};
  const redactedKeys: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    if (isSensitiveKey(key, patterns) && value !== undefined) {
      redacted[key] = maskValue(String(value), maskChar, visibleChars);
      redactedKeys.push(key);
    } else {
      redacted[key] = value;
    }
  }

  return { original: env, redacted, redactedKeys };
}

export function formatRedactResult(result: RedactResult): string {
  const lines: string[] = [];
  lines.push(`Redacted ${result.redactedKeys.length} sensitive key(s):`);
  if (result.redactedKeys.length > 0) {
    result.redactedKeys.forEach((key) => {
      lines.push(`  - ${key}: ${result.redacted[key]}`);
    });
  } else {
    lines.push('  (none found)');
  }
  return lines.join('\n');
}
