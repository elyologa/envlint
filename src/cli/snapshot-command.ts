import * as path from 'path';
import {
  takeSnapshot,
  saveSnapshot,
  loadSnapshot,
  compareSnapshots,
  formatSnapshotCompare,
} from '../snapshotter';

export interface SnapshotArgs {
  subcommand: 'take' | 'compare';
  envFile?: string;
  snapshotOut?: string;
  before?: string;
  after?: string;
}

export function parseSnapshotArgs(argv: string[]): SnapshotArgs {
  const args: SnapshotArgs = { subcommand: 'take' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === 'compare') {
      args.subcommand = 'compare';
    } else if (arg === 'take') {
      args.subcommand = 'take';
    } else if (arg === '--env' && argv[i + 1]) {
      args.envFile = argv[++i];
    } else if (arg === '--out' && argv[i + 1]) {
      args.snapshotOut = argv[++i];
    } else if (arg === '--before' && argv[i + 1]) {
      args.before = argv[++i];
    } else if (arg === '--after' && argv[i + 1]) {
      args.after = argv[++i];
    }
  }
  return args;
}

export function runSnapshotCommand(argv: string[]): void {
  const args = parseSnapshotArgs(argv);

  if (args.subcommand === 'take') {
    const envFile = args.envFile ?? '.env';
    const outFile =
      args.snapshotOut ??
      path.join(
        process.cwd(),
        `.env.snapshot.${Date.now()}.json`
      );
    const snapshot = takeSnapshot(envFile);
    saveSnapshot(snapshot, outFile);
    console.log(`Snapshot saved to ${outFile}`);
    return;
  }

  if (args.subcommand === 'compare') {
    if (!args.before || !args.after) {
      console.error('Error: --before and --after snapshot paths are required for compare.');
      process.exit(1);
    }
    const before = loadSnapshot(args.before);
    const after = loadSnapshot(args.after);
    const result = compareSnapshots(before, after);
    console.log(formatSnapshotCompare(result, before, after));
    const hasChanges =
      result.added.length > 0 ||
      result.removed.length > 0 ||
      result.changed.length > 0;
    if (hasChanges) process.exit(1);
    return;
  }

  console.error(`Unknown snapshot subcommand: ${args.subcommand}`);
  process.exit(1);
}
