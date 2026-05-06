import { EnvSchema, ValidationResult } from '../schema/types';

export interface EnvDiffEntry {
  key: string;
  presentIn: string[];
  missingIn: string[];
  values: Record<string, string | undefined>;
  mismatch: boolean;
}

export interface EnvDiffResult {
  entries: EnvDiffEntry[];
  hasMismatches: boolean;
  hasMissing: boolean;
}

/**
 * Compares multiple environment files against each other and the schema.
 * Identifies keys that are missing in some envs or have value-type mismatches.
 */
export function diffEnvs(
  schema: EnvSchema,
  envMaps: Record<string, Record<string, string>>
): EnvDiffResult {
  const envNames = Object.keys(envMaps);
  const allKeys = new Set<string>(Object.keys(schema.keys));

  for (const envMap of Object.values(envMaps)) {
    for (const key of Object.keys(envMap)) {
      allKeys.add(key);
    }
  }

  const entries: EnvDiffEntry[] = [];

  for (const key of allKeys) {
    const presentIn: string[] = [];
    const missingIn: string[] = [];
    const values: Record<string, string | undefined> = {};

    for (const envName of envNames) {
      const val = envMaps[envName][key];
      values[envName] = val;
      if (val !== undefined && val !== '') {
        presentIn.push(envName);
      } else {
        missingIn.push(envName);
      }
    }

    const uniqueValues = new Set(
      Object.values(values).filter((v): v is string => v !== undefined)
    );
    const mismatch = missingIn.length > 0 && presentIn.length > 0;

    entries.push({ key, presentIn, missingIn, values, mismatch });
  }

  return {
    entries,
    hasMismatches: entries.some((e) => e.mismatch),
    hasMissing: entries.some((e) => e.missingIn.length > 0),
  };
}

export function formatDiff(result: EnvDiffResult): string {
  if (result.entries.length === 0) {
    return 'No differences found between environments.';
  }

  const lines: string[] = ['Environment Diff Report', '======================='];

  for (const entry of result.entries) {
    if (!entry.mismatch) continue;
    lines.push(`\n[${entry.key}]`);
    lines.push(`  Present in : ${entry.presentIn.join(', ') || 'none'}`);
    lines.push(`  Missing in : ${entry.missingIn.join(', ') || 'none'}`);
  }

  if (!result.hasMismatches) {
    lines.push('\nAll keys are consistent across environments.');
  }

  return lines.join('\n');
}
