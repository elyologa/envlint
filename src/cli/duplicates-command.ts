import * as path from 'path';
import { checkDuplicatesInFile, formatDuplicateResult } from '../duplicates/duplicates';

export interface DuplicatesArgs {
  envFile: string;
  strict: boolean;
}

export function parseDuplicatesArgs(argv: string[]): DuplicatesArgs {
  const args = argv.slice(2);
  let envFile = '.env';
  let strict = false;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--env' || args[i] === '-e') && args[i + 1]) {
      envFile = args[++i];
    } else if (args[i] === '--strict') {
      strict = true;
    } else if (!args[i].startsWith('-')) {
      envFile = args[i];
    }
  }

  return { envFile: path.resolve(envFile), strict };
}

export function runDuplicatesCommand(argv: string[]): void {
  const { envFile, strict } = parseDuplicatesArgs(argv);

  let duplicates;
  try {
    duplicates = checkDuplicatesInFile(envFile);
  } catch (err: any) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }

  const report = formatDuplicateResult(path.basename(envFile), duplicates);
  console.log(report);

  if (duplicates.length > 0 && strict) {
    process.exit(1);
  }
}
