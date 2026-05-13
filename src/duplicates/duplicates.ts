import * as fs from 'fs';

export interface DuplicateEntry {
  key: string;
  lines: number[];
  values: string[];
}

export interface DuplicateResult {
  file: string;
  duplicates: DuplicateEntry[];
}

export function findDuplicates(content: string): DuplicateEntry[] {
  const lines = content.split('\n');
  const seen = new Map<string, { lines: number[]; values: string[] }>();

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    if (!seen.has(key)) {
      seen.set(key, { lines: [], values: [] });
    }
    const entry = seen.get(key)!;
    entry.lines.push(index + 1);
    entry.values.push(value);
  });

  const duplicates: DuplicateEntry[] = [];
  for (const [key, { lines, values }] of seen.entries()) {
    if (lines.length > 1) {
      duplicates.push({ key, lines, values });
    }
  }

  return duplicates;
}

export function checkDuplicatesInFile(filePath: string): DuplicateResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const duplicates = findDuplicates(content);
  return { file: filePath, duplicates };
}

export function formatDuplicateResult(result: DuplicateResult): string {
  if (result.duplicates.length === 0) {
    return `✔ No duplicate keys found in ${result.file}`;
  }

  const lines: string[] = [
    `✖ Found ${result.duplicates.length} duplicate key(s) in ${result.file}:`,
  ];

  for (const dup of result.duplicates) {
    lines.push(`  ${dup.key}`);
    dup.lines.forEach((line, i) => {
      lines.push(`    line ${line}: ${dup.values[i]}`);
    });
  }

  return lines.join('\n');
}
