import * as path from 'path';
import { mergeEnvFiles, formatMergeResult } from '../merger/merger';

export interface MergeArgs {
  base: string;
  incoming: string;
  output: string;
  overwrite: boolean;
  dryRun: boolean;
}

export function parseMergeArgs(argv: string[]): MergeArgs {
  const args = argv.slice(2);
  let base = '';
  let incoming = '';
  let output = '';
  let overwrite = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base':
        base = args[++i];
        break;
      case '--incoming':
        incoming = args[++i];
        break;
      case '--output':
        output = args[++i];
        break;
      case '--overwrite':
        overwrite = true;
        break;
      case '--dry-run':
        dryRun = true;
        break;
    }
  }

  if (!base || !incoming) {
    throw new Error('merge-command: --base and --incoming are required');
  }

  if (!output) {
    output = path.resolve(process.cwd(), '.env.merged');
  }

  return { base, incoming, output, overwrite, dryRun };
}

export function runMergeCommand(argv: string[]): void {
  const args = parseMergeArgs(argv);

  const result = mergeEnvFiles(
    path.resolve(args.base),
    path.resolve(args.incoming),
    path.resolve(args.output),
    { overwrite: args.overwrite, dryRun: args.dryRun }
  );

  console.log(formatMergeResult(result));

  if (args.dryRun) {
    console.log('Dry run: no file written.');
  } else {
    console.log(`Merged env written to: ${args.output}`);
  }
}
