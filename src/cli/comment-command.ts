import * as fs from 'fs';
import * as path from 'path';
import { commentKeys, uncommentKeys, saveCommented, formatCommentResult } from '../commenter';

export interface CommentArgs {
  file: string;
  keys: string[];
  uncomment: boolean;
  write: boolean;
}

export function parseCommentArgs(argv: string[]): CommentArgs {
  const args = argv.slice(2);
  let file = '.env';
  const keys: string[] = [];
  let uncomment = false;
  let write = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' || arg === '-f') {
      file = args[++i];
    } else if (arg === '--key' || arg === '-k') {
      keys.push(args[++i]);
    } else if (arg === '--uncomment' || arg === '-u') {
      uncomment = true;
    } else if (arg === '--write' || arg === '-w') {
      write = true;
    }
  }

  if (keys.length === 0) {
    throw new Error('At least one --key must be specified.');
  }

  return { file, keys, uncomment, write };
}

export async function runCommentCommand(argv: string[]): Promise<void> {
  let args: CommentArgs;
  try {
    args = parseCommentArgs(argv);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const filePath = path.resolve(args.file);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  const result = args.uncomment
    ? uncommentKeys(content, args.keys)
    : commentKeys(content, args.keys);

  if (args.write) {
    saveCommented(filePath, result.content);
    console.log(`Written to ${filePath}`);
  }

  console.log(formatCommentResult(result));
}
