#!/usr/bin/env node
import { run } from './runner';

function parseArgs(argv: string[]): {
  schemaPath: string;
  envPaths: string[];
  format: 'text' | 'json';
  strict: boolean;
} {
  const args = argv.slice(2);
  let schemaPath = '.envschema.json';
  const envPaths: string[] = [];
  let format: 'text' | 'json' = 'text';
  let strict = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--schema' || arg === '-s') {
      schemaPath = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      const val = args[++i];
      if (val === 'json' || val === 'text') format = val;
    } else if (arg === '--strict') {
      strict = true;
    } else if (!arg.startsWith('-')) {
      envPaths.push(arg);
    }
  }

  if (envPaths.length === 0) {
    envPaths.push('.env');
  }

  return { schemaPath, envPaths, format, strict };
}

function main(): void {
  const options = parseArgs(process.argv);

  try {
    const result = run(options);
    console.log(result.output);
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(2);
  }
}

main();
