import * as fs from 'fs';
import { loadEnvFile } from '../schema/loader';
import { exportEnv, saveExport, formatExportResult, ExportFormat } from '../exporter';

export interface ExportCommandArgs {
  envFile: string;
  format: ExportFormat;
  output?: string;
  redact: boolean;
}

const VALID_FORMATS: ExportFormat[] = ['json', 'yaml', 'shell', 'docker'];

export function parseExportArgs(argv: string[]): ExportCommandArgs {
  const args = argv.slice(2);
  let envFile = '.env';
  let format: ExportFormat = 'json';
  let output: string | undefined;
  let redact = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
      envFile = args[++i];
    } else if (args[i] === '--format' && args[i + 1]) {
      const f = args[++i] as ExportFormat;
      if (!VALID_FORMATS.includes(f)) {
        throw new Error(`Invalid format "${f}". Valid formats: ${VALID_FORMATS.join(', ')}`);
      }
      format = f;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[++i];
    } else if (args[i] === '--redact') {
      redact = true;
    }
  }

  return { envFile, format, output, redact };
}

export function runExportCommand(argv: string[]): void {
  const args = parseExportArgs(argv);

  if (!fs.existsSync(args.envFile)) {
    console.error(`Error: env file not found: ${args.envFile}`);
    process.exit(1);
  }

  const env = loadEnvFile(args.envFile);
  const result = exportEnv(env, {
    format: args.format,
    redactSensitive: args.redact,
  });

  if (args.output) {
    saveExport(result, args.output);
    console.log(`Exported ${result.keyCount} key(s) to ${args.output} (${args.format})`);
  } else {
    console.log(formatExportResult(result));
  }
}
