import * as fs from 'fs';
import * as path from 'path';

export interface MergeOptions {
  overwrite?: boolean;
  dryRun?: boolean;
}

export interface MergeResult {
  merged: Record<string, string>;
  added: string[];
  overwritten: string[];
  skipped: string[];
}

export function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

export function mergeEnvs(
  base: Record<string, string>,
  incoming: Record<string, string>,
  options: MergeOptions = {}
): MergeResult {
  const { overwrite = false } = options;
  const merged: Record<string, string> = { ...base };
  const added: string[] = [];
  const overwritten: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in base)) {
      merged[key] = value;
      added.push(key);
    } else if (overwrite) {
      merged[key] = value;
      overwritten.push(key);
    } else {
      skipped.push(key);
    }
  }

  return { merged, added, overwritten, skipped };
}

export function mergeEnvFiles(
  basePath: string,
  incomingPath: string,
  outputPath: string,
  options: MergeOptions = {}
): MergeResult {
  const baseContent = fs.readFileSync(basePath, 'utf-8');
  const incomingContent = fs.readFileSync(incomingPath, 'utf-8');
  const base = parseEnvContent(baseContent);
  const incoming = parseEnvContent(incomingContent);
  const result = mergeEnvs(base, incoming, options);

  if (!options.dryRun) {
    const lines = Object.entries(result.merged).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf-8');
  }

  return result;
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = ['Merge Result:'];
  lines.push(`  Added    (${result.added.length}): ${result.added.join(', ') || 'none'}`);
  lines.push(`  Overwritten (${result.overwritten.length}): ${result.overwritten.join(', ') || 'none'}`);
  lines.push(`  Skipped  (${result.skipped.length}): ${result.skipped.join(', ') || 'none'}`);
  return lines.join('\n');
}
