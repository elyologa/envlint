import * as fs from 'fs';
import * as path from 'path';
import { loadEnvFile } from '../schema/loader';
import { sortEnv, saveSorted, formatSortResult, SortOptions, SortResult } from '../sorter';

export interface SortArgs {
  envFile: string;
  output?: string;
  groupByPrefix: boolean;
  caseSensitive: boolean;
  dryRun: boolean;
}

export function parseSortArgs(argv: string[]): SortArgs {
  const args: SortArgs = {
    envFile: '.env',
    groupByPrefix: false,
    caseSensitive: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--env' || arg === '-e') && argv[i + 1]) {
      args.envFile = argv[++i];
    } else if ((arg === '--output' || arg === '-o') && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === '--group-by-prefix') {
      args.groupByPrefix = true;
    } else if (arg === '--case-sensitive') {
      args.caseSensitive = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    }
  }

  return args;
}

export function runSortCommand(argv: string[]): void {
  const args = parseSortArgs(argv);

  if (!fs.existsSync(args.envFile)) {
    console.error(`Error: env file not found: ${args.envFile}`);
    process.exit(1);
  }

  const original = loadEnvFile(args.envFile);

  const options: SortOptions = {
    alphabetical: true,
    groupByPrefix: args.groupByPrefix,
    caseSensitive: args.caseSensitive,
  };

  const sorted = sortEnv(original, options);
  const originalKeys = Object.keys(original);
  const sortedKeys = Object.keys(sorted);
  const changed = originalKeys.some((k, i) => k !== sortedKeys[i]);

  const outputPath = args.output ?? args.envFile;

  const result: SortResult = { original, sorted, changed, outputPath: args.dryRun ? undefined : outputPath };

  if (!args.dryRun) {
    saveSorted(sorted, outputPath);
  }

  console.log(formatSortResult(result));

  if (args.dryRun) {
    console.log('\nDry run — no files written.');
    console.log('Sorted order:');
    sortedKeys.forEach(k => console.log(`  ${k}=${sorted[k]}`));
  }
}
