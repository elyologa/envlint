import * as fs from 'fs';
import * as path from 'path';
import { loadSchema, loadEnvFile } from '../schema/loader';
import { lintEnv, formatLintResult } from '../linter/linter';

export interface LintCommandArgs {
  envFile: string;
  schemaFile: string;
  strict: boolean;
  json: boolean;
}

export function parseLintArgs(argv: string[]): LintCommandArgs {
  const args: LintCommandArgs = {
    envFile: '.env',
    schemaFile: 'envlint.schema.json',
    strict: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--env' && argv[i + 1]) args.envFile = argv[++i];
    else if (argv[i] === '--schema' && argv[i + 1]) args.schemaFile = argv[++i];
    else if (argv[i] === '--strict') args.strict = true;
    else if (argv[i] === '--json') args.json = true;
  }

  return args;
}

export async function runLintCommand(argv: string[]): Promise<void> {
  const args = parseLintArgs(argv);

  if (!fs.existsSync(args.schemaFile)) {
    console.error(`Schema file not found: ${args.schemaFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(args.envFile)) {
    console.error(`Env file not found: ${args.envFile}`);
    process.exit(1);
  }

  const schema = loadSchema(args.schemaFile);
  const envVars = loadEnvFile(args.envFile);
  const result = lintEnv(envVars, schema, args.envFile);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatLintResult(result));
  }

  const hasErrors = result.issues.some(i => i.severity === 'error');
  const hasWarnings = result.issues.some(i => i.severity === 'warn');

  if (hasErrors || (args.strict && hasWarnings)) {
    process.exit(1);
  }
}
