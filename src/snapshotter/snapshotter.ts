import * as fs from 'fs';
import * as path from 'path';
import { loadEnvFile } from '../schema/loader';

export interface EnvSnapshot {
  timestamp: string;
  envFile: string;
  entries: Record<string, string>;
}

export interface SnapshotCompareResult {
  added: string[];
  removed: string[];
  changed: Array<{ key: string; from: string; to: string }>;
  unchanged: string[];
}

export function takeSnapshot(envFilePath: string): EnvSnapshot {
  const entries = loadEnvFile(envFilePath);
  return {
    timestamp: new Date().toISOString(),
    envFile: path.resolve(envFilePath),
    entries,
  };
}

export function saveSnapshot(snapshot: EnvSnapshot, outputPath: string): void {
  const json = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(outputPath, json, 'utf-8');
}

export function loadSnapshot(snapshotPath: string): EnvSnapshot {
  const raw = fs.readFileSync(snapshotPath, 'utf-8');
  return JSON.parse(raw) as EnvSnapshot;
}

export function compareSnapshots(
  before: EnvSnapshot,
  after: EnvSnapshot
): SnapshotCompareResult {
  const beforeKeys = new Set(Object.keys(before.entries));
  const afterKeys = new Set(Object.keys(after.entries));

  const added = [...afterKeys].filter((k) => !beforeKeys.has(k));
  const removed = [...beforeKeys].filter((k) => !afterKeys.has(k));
  const unchanged: string[] = [];
  const changed: Array<{ key: string; from: string; to: string }> = [];

  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) continue;
    if (before.entries[key] === after.entries[key]) {
      unchanged.push(key);
    } else {
      changed.push({ key, from: before.entries[key], to: after.entries[key] });
    }
  }

  return { added, removed, changed, unchanged };
}

export function formatSnapshotCompare(
  result: SnapshotCompareResult,
  before: EnvSnapshot,
  after: EnvSnapshot
): string {
  const lines: string[] = [
    `Snapshot comparison`,
    `  Before: ${before.timestamp} (${before.envFile})`,
    `  After:  ${after.timestamp} (${after.envFile})`,
    '',
  ];
  if (result.added.length > 0) {
    lines.push(`Added (${result.added.length}):`);
    result.added.forEach((k) => lines.push(`  + ${k}`));
  }
  if (result.removed.length > 0) {
    lines.push(`Removed (${result.removed.length}):`);
    result.removed.forEach((k) => lines.push(`  - ${k}`));
  }
  if (result.changed.length > 0) {
    lines.push(`Changed (${result.changed.length}):`);
    result.changed.forEach(({ key, from, to }) =>
      lines.push(`  ~ ${key}: "${from}" → "${to}"`)
    );
  }
  if (result.added.length === 0 && result.removed.length === 0 && result.changed.length === 0) {
    lines.push('No changes detected.');
  }
  return lines.join('\n');
}
