import * as fs from 'fs';

export interface SortOptions {
  alphabetical?: boolean;
  groupByPrefix?: boolean;
  caseSensitive?: boolean;
}

export interface SortResult {
  original: Record<string, string>;
  sorted: Record<string, string>;
  changed: boolean;
  outputPath?: string;
}

export function sortEnv(
  env: Record<string, string>,
  options: SortOptions = {}
): Record<string, string> {
  const { alphabetical = true, groupByPrefix = false, caseSensitive = false } = options;

  const entries = Object.entries(env);

  if (groupByPrefix) {
    const groups: Record<string, [string, string][]> = {};
    const noPrefix: [string, string][] = [];

    for (const entry of entries) {
      const underscoreIdx = entry[0].indexOf('_');
      if (underscoreIdx > 0) {
        const prefix = entry[0].slice(0, underscoreIdx);
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(entry);
      } else {
        noPrefix.push(entry);
      }
    }

    const sortFn = (a: [string, string], b: [string, string]) => {
      const ka = caseSensitive ? a[0] : a[0].toLowerCase();
      const kb = caseSensitive ? b[0] : b[0].toLowerCase();
      return alphabetical ? ka.localeCompare(kb) : 0;
    };

    const sortedPrefixes = Object.keys(groups).sort((a, b) =>
      caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase())
    );

    const sorted: [string, string][] = [
      ...noPrefix.sort(sortFn),
      ...sortedPrefixes.flatMap(p => groups[p].sort(sortFn)),
    ];

    return Object.fromEntries(sorted);
  }

  const sortFn = (a: [string, string], b: [string, string]) => {
    if (!alphabetical) return 0;
    const ka = caseSensitive ? a[0] : a[0].toLowerCase();
    const kb = caseSensitive ? b[0] : b[0].toLowerCase();
    return ka.localeCompare(kb);
  };

  return Object.fromEntries(entries.sort(sortFn));
}

export function saveSorted(sorted: Record<string, string>, outputPath: string): void {
  const lines = Object.entries(sorted).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf-8');
}

export function formatSortResult(result: SortResult): string {
  const lines: string[] = [];
  lines.push(`Sort result: ${result.changed ? 'reordered' : 'already sorted'}`);
  lines.push(`Keys: ${Object.keys(result.sorted).join(', ')}`);
  if (result.outputPath) {
    lines.push(`Written to: ${result.outputPath}`);
  }
  return lines.join('\n');
}
