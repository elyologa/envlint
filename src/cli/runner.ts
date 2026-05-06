import { loadSchema, loadEnvFile } from '../schema/loader';
import { validate } from '../schema/validator';
import { generateReport, formatReport } from '../reporter/reporter';
import * as path from 'path';
import * as fs from 'fs';

export interface RunOptions {
  schemaPath: string;
  envPaths: string[];
  format?: 'text' | 'json';
  strict?: boolean;
}

export interface RunResult {
  success: boolean;
  output: string;
  errorCount: number;
}

export function run(options: RunOptions): RunResult {
  const { schemaPath, envPaths, format = 'text', strict = false } = options;

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schema = loadSchema(schemaPath);
  const allReports: ReturnType<typeof generateReport>[] = [];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      throw new Error(`Env file not found: ${envPath}`);
    }

    const envVars = loadEnvFile(envPath);
    const errors = validate(schema, envVars, { strict });
    const report = generateReport(path.basename(envPath), errors);
    allReports.push(report);
  }

  const totalErrors = allReports.reduce((sum, r) => sum + r.errorCount, 0);
  const combinedOutput =
    format === 'json'
      ? JSON.stringify(allReports, null, 2)
      : allReports.map(formatReport).join('\n');

  return {
    success: totalErrors === 0,
    output: combinedOutput,
    errorCount: totalErrors,
  };
}
