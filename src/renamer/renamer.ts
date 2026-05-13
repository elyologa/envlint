import * as fs from 'fs';

export interface RenameRule {
  from: string;
  to: string;
}

export interface RenameResult {
  applied: RenameRule[];
  skipped: RenameRule[];
  content: string;
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
    result[key] = value;
  }
  return result;
}

export function renameKeys(
  content: string,
  rules: RenameRule[]
): RenameResult {
  const applied: RenameRule[] = [];
  const skipped: RenameRule[] = [];
  const existing = parseEnvContent(content);
  let updated = content;

  for (const rule of rules) {
    if (!(rule.from in existing)) {
      skipped.push(rule);
      continue;
    }
    if (rule.to in existing) {
      skipped.push(rule);
      continue;
    }
    const regex = new RegExp(`^(${rule.from})(\\s*=)`, 'm');
    if (regex.test(updated)) {
      updated = updated.replace(regex, `${rule.to}$2`);
      applied.push(rule);
    } else {
      skipped.push(rule);
    }
  }

  return { applied, skipped, content: updated };
}

export function saveRenamed(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function formatRenameResult(result: RenameResult): string {
  const lines: string[] = [];
  if (result.applied.length > 0) {
    lines.push('Renamed keys:');
    for (const r of result.applied) {
      lines.push(`  ${r.from} → ${r.to}`);
    }
  }
  if (result.skipped.length > 0) {
    lines.push('Skipped (key missing or target already exists):');
    for (const r of result.skipped) {
      lines.push(`  ${r.from} → ${r.to}`);
    }
  }
  if (result.applied.length === 0 && result.skipped.length === 0) {
    lines.push('No rename rules provided.');
  }
  return lines.join('\n');
}
