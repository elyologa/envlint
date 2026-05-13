import * as fs from 'fs';
import * as path from 'path';
import { renameKeys, saveRenamed, formatRenameResult, RenameRule } from '../renamer/renamer';

export interface RenameCommandArgs {
  envFile: string;
  rules: RenameRule[];
  dryRun: boolean;
}

export function parseRenameArgs(argv: string[]): RenameCommandArgs {
  const args = argv.slice(2);
  let envFile = '.env';
  const rules: RenameRule[] = [];
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
      envFile = args[++i];
    } else if (args[i] === '--rename' && args[i + 1]) {
      const pair = args[++i];
      const [from, to] = pair.split(':');
      if (from && to) {
        rules.push({ from: from.trim(), to: to.trim() });
      }
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { envFile, rules, dryRun };
}

export function runRenameCommand(argv: string[]): void {
  const { envFile, rules, dryRun } = parseRenameArgs(argv);

  const filePath = path.resolve(process.cwd(), envFile);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  if (rules.length === 0) {
    console.error('Error: No rename rules provided. Use --rename OLD_KEY:NEW_KEY');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const result = renameKeys(content, rules);

  console.log(formatRenameResult(result));

  if (!dryRun && result.applied.length > 0) {
    saveRenamed(filePath, result.content);
    console.log(`\nSaved changes to ${envFile}`);
  } else if (dryRun) {
    console.log('\n(Dry run — no changes written)');
  }
}
