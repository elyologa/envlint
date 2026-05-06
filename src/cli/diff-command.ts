import * as path from 'path';
import { loadSchema, loadEnvFile } from '../schema/loader';
import { diffEnvs, formatDiff } from '../differ';

export interface DiffCommandOptions {
  schemaPath: string;
  envFiles: string[];
  exitOnDiff?: boolean;
}

/**
 * Runs the diff command: loads a schema and multiple .env files,
 * compares them, prints a report, and optionally exits with a non-zero code.
 */
export async function runDiffCommand(options: DiffCommandOptions): Promise<void> {
  const { schemaPath, envFiles, exitOnDiff = true } = options;

  if (envFiles.length < 2) {
    console.error('Error: At least two environment files are required for diffing.');
    process.exit(1);
  }

  let schema;
  try {
    schema = loadSchema(schemaPath);
  } catch (err) {
    console.error(`Error loading schema: ${(err as Error).message}`);
    process.exit(1);
  }

  const envMaps: Record<string, Record<string, string>> = {};

  for (const filePath of envFiles) {
    const envName = path.basename(filePath);
    try {
      envMaps[envName] = loadEnvFile(filePath);
    } catch (err) {
      console.error(`Error loading env file "${filePath}": ${(err as Error).message}`);
      process.exit(1);
    }
  }

  const result = diffEnvs(schema, envMaps);
  const report = formatDiff(result);

  console.log(report);

  if (exitOnDiff && (result.hasMismatches || result.hasMissing)) {
    process.exit(1);
  }
}

export function parseDiffArgs(args: string[]): DiffCommandOptions | null {
  const schemaIndex = args.indexOf('--schema');
  if (schemaIndex === -1 || !args[schemaIndex + 1]) {
    console.error('Usage: envlint diff --schema <schema.json> <.env.dev> <.env.prod> ...');
    return null;
  }

  const schemaPath = args[schemaIndex + 1];
  const envFiles = args.filter((a, i) => !a.startsWith('--') && i !== schemaIndex + 1);

  return { schemaPath, envFiles };
}
