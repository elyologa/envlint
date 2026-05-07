import * as fs from 'fs';
import * as path from 'path';

export interface InterpolationResult {
  key: string;
  original: string;
  resolved: string;
  missing: string[];
}

export interface InterpolateEnvResult {
  entries: InterpolationResult[];
  hasUnresolved: boolean;
}

/**
 * Resolves ${VAR} references within a value string using provided env map.
 */
export function interpolateValue(
  key: string,
  value: string,
  env: Record<string, string>
): InterpolationResult {
  const missing: string[] = [];
  const resolved = value.replace(/\$\{([^}]+)\}/g, (match, refKey) => {
    if (Object.prototype.hasOwnProperty.call(env, refKey)) {
      return env[refKey];
    }
    missing.push(refKey);
    return match;
  });
  return { key, original: value, resolved, missing };
}

/**
 * Interpolates all values in an env map, resolving cross-references.
 */
export function interpolateEnv(
  env: Record<string, string>
): InterpolateEnvResult {
  const entries: InterpolationResult[] = [];
  let hasUnresolved = false;

  for (const [key, value] of Object.entries(env)) {
    const result = interpolateValue(key, value, env);
    if (result.missing.length > 0) {
      hasUnresolved = true;
    }
    entries.push(result);
  }

  return { entries, hasUnresolved };
}

/**
 * Formats interpolation results into a human-readable report string.
 */
export function formatInterpolationResult(result: InterpolateEnvResult): string {
  const lines: string[] = [];

  for (const entry of result.entries) {
    if (entry.missing.length > 0) {
      lines.push(
        `[UNRESOLVED] ${entry.key}: "${entry.original}" — missing refs: ${entry.missing.join(', ')}`
      );
    } else if (entry.original !== entry.resolved) {
      lines.push(`[RESOLVED]   ${entry.key}: "${entry.original}" => "${entry.resolved}"`);
    }
  }

  if (lines.length === 0) {
    return 'No interpolation references found.';
  }

  const header = result.hasUnresolved
    ? 'Interpolation completed with unresolved references:'
    : 'Interpolation completed successfully:';

  return [header, ...lines].join('\n');
}
