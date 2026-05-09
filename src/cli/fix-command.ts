import { loadSchema, loadEnvFile } from '../schema/loader';
import { validate } from '../schema/validator';
import { fixEnvFile, formatFixResult } from '../fixer';

export interface FixCommandArgs {
  schemaPath: string;
  envPath: string;
  dryRun: boolean;
}

export function parseFixArgs(argv: string[]): FixCommandArgs {
  const args = argv.slice(2);
  let schemaPath = '.envschema.json';
  let envPath = '.env';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--schema' || args[i] === '-s') && args[i + 1]) {
      schemaPath = args[++i];
    } else if ((args[i] === '--env' || args[i] === '-e') && args[i + 1]) {
      envPath = args[++i];
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { schemaPath, envPath, dryRun };
}

export async function runFixCommand(args: FixCommandArgs): Promise<number> {
  let schema;
  try {
    schema = loadSchema(args.schemaPath);
  } catch (err) {
    console.error(`Error loading schema: ${(err as Error).message}`);
    return 1;
  }

  let envVars: Record<string, string>;
  try {
    envVars = loadEnvFile(args.envPath);
  } catch (err) {
    // If the env file doesn't exist, treat it as empty and let the fixer create it.
    // Re-throw unexpected errors (e.g. permission denied).
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.error(`Error loading env file: ${(err as Error).message}`);
      return 1;
    }
    envVars = {};
  }

  const validationResult = validate(schema, envVars);

  if (validationResult.valid) {
    console.log(`✔ ${args.envPath} is already valid. Nothing to fix.`);
    return 0;
  }

  const fixResult = fixEnvFile(args.envPath, schema, validationResult, args.dryRun);
  console.log(formatFixResult(fixResult, args.dryRun));

  if (args.dryRun) {
    console.log('Run without --dry-run to apply changes.');
  }

  // Return 0 if fixes were applied or previewed, 1 if nothing could be fixed
  return fixResult.addedKeys.length > 0 || fixResult.skippedKeys.length === 0 ? 0 : 1;
}
