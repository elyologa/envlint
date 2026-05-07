import * as path from 'path';
import { migrateEnvFile, formatMigrationResult } from '../migrator/migrator';

export interface MigrateArgs {
  envFile: string;
  renameMap: Record<string, string>;
  dryRun: boolean;
}

/**
 * Parses CLI args for the migrate command.
 * Usage: envlint migrate <envFile> --rename OLD_KEY:NEW_KEY [--dry-run]
 */
export function parseMigrateArgs(argv: string[]): MigrateArgs {
  const args = argv.slice(2);
  const commandIndex = args.indexOf('migrate');
  if (commandIndex === -1) {
    throw new Error('Missing "migrate" command');
  }

  const rest = args.slice(commandIndex + 1);
  if (rest.length === 0 || rest[0].startsWith('--')) {
    throw new Error('Usage: envlint migrate <envFile> --rename OLD:NEW [--dry-run]');
  }

  const envFile = path.resolve(rest[0]);
  const dryRun = rest.includes('--dry-run');
  const renameMap: Record<string, string> = {};

  for (let i = 1; i < rest.length; i++) {
    if (rest[i] === '--rename' && rest[i + 1]) {
      const pair = rest[i + 1];
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) {
        throw new Error(`Invalid rename pair "${pair}". Expected format OLD_KEY:NEW_KEY`);
      }
      const oldKey = pair.substring(0, colonIdx).trim();
      const newKey = pair.substring(colonIdx + 1).trim();
      if (!oldKey || !newKey) {
        throw new Error(`Invalid rename pair "${pair}". Keys must not be empty.`);
      }
      renameMap[oldKey] = newKey;
      i++;
    }
  }

  if (Object.keys(renameMap).length === 0) {
    throw new Error('At least one --rename OLD:NEW pair is required.');
  }

  return { envFile, renameMap, dryRun };
}

export function runMigrateCommand(argv: string[]): void {
  const args = parseMigrateArgs(argv);
  const result = migrateEnvFile(args.envFile, args.renameMap, args.dryRun);
  console.log(formatMigrationResult(result));
  if (!args.dryRun && result.renamed.length > 0) {
    process.exit(0);
  }
}
