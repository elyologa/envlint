import * as path from 'path';
import * as fs from 'fs';
import { loadSchema, loadEnvFile } from '../schema/loader';
import { auditEnv, formatAuditResult } from '../auditor/auditor';

export interface AuditArgs {
  schemaPath: string;
  envPaths: string[];
  outputJson: boolean;
}

export function parseAuditArgs(argv: string[]): AuditArgs {
  const args = argv.slice(2);
  const schemaIndex = args.indexOf('--schema');
  const jsonFlag = args.includes('--json');

  if (schemaIndex === -1 || schemaIndex + 1 >= args.length) {
    throw new Error('Missing required argument: --schema <path>');
  }

  const schemaPath = args[schemaIndex + 1];
  const envPaths = args.filter(
    (a, i) => !a.startsWith('--') && i !== schemaIndex + 1
  );

  if (envPaths.length === 0) {
    throw new Error('At least one .env file path must be provided.');
  }

  return { schemaPath, envPaths, outputJson: jsonFlag };
}

export async function runAuditCommand(argv: string[]): Promise<void> {
  let args: AuditArgs;

  try {
    args = parseAuditArgs(argv);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    console.error('Usage: envlint audit --schema <schema.json> [--json] <.env> [<.env2> ...]');
    process.exit(1);
  }

  const schema = loadSchema(args.schemaPath);
  let hasIssues = false;

  for (const envPath of args.envPaths) {
    if (!fs.existsSync(envPath)) {
      console.error(`Error: File not found: ${envPath}`);
      process.exit(1);
    }

    const env = loadEnvFile(envPath);
    const result = auditEnv(env, schema, path.basename(envPath));

    if (result.warnings.length > 0 || result.suggestions.length > 0) {
      hasIssues = true;
    }

    if (args.outputJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatAuditResult(result));
    }
  }

  if (hasIssues) {
    process.exit(2);
  }
}
