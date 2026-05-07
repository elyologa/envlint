import * as fs from 'fs';
import * as path from 'path';

export interface MigrationEntry {
  key: string;
  oldKey: string;
  newKey: string;
  value: string;
}

export interface MigrationResult {
  file: string;
  renamed: MigrationEntry[];
  skipped: string[];
  written: boolean;
}

/**
 * Renames keys in an env file according to a migration map.
 * @param envPath Path to the .env file
 * @param renameMap Map of oldKey -> newKey
 * @param dryRun If true, do not write changes to disk
 */
export function migrateEnvFile(
  envPath: string,
  renameMap: Record<string, string>,
  dryRun = false
): MigrationResult {
  const result: MigrationResult = {
    file: envPath,
    renamed: [],
    skipped: [],
    written: false,
  };

  if (!fs.existsSync(envPath)) {
    throw new Error(`Env file not found: ${envPath}`);
  }

  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const usedNewKeys = new Set<string>();

  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return line;

    const key = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1);

    if (renameMap[key]) {
      const newKey = renameMap[key];
      if (usedNewKeys.has(newKey)) {
        result.skipped.push(key);
        return line;
      }
      usedNewKeys.add(newKey);
      result.renamed.push({ key, oldKey: key, newKey, value: value.trim() });
      return `${newKey}=${value}`;
    }

    return line;
  });

  if (!dryRun && result.renamed.length > 0) {
    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf-8');
    result.written = true;
  }

  return result;
}

export function formatMigrationResult(result: MigrationResult): string {
  const lines: string[] = [`Migration report for: ${result.file}`];

  if (result.renamed.length === 0) {
    lines.push('  No keys were renamed.');
  } else {
    lines.push('  Renamed keys:');
    for (const entry of result.renamed) {
      lines.push(`    ${entry.oldKey} -> ${entry.newKey}`);
    }
  }

  if (result.skipped.length > 0) {
    lines.push('  Skipped (conflict):');
    for (const key of result.skipped) {
      lines.push(`    ${key}`);
    }
  }

  lines.push(result.written ? '  Changes written to disk.' : '  Dry run — no changes written.');
  return lines.join('\n');
}
