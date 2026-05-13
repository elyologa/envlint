import * as fs from 'fs';

export interface CommentedEnv {
  original: string;
  commented: string;
  keysCommented: string[];
}

export interface CommentOptions {
  keys?: string[];
  pattern?: RegExp;
  dryRun?: boolean;
}

/**
 * Comments out specific keys in an env file by prepending '#'
 */
export function commentKeys(
  content: string,
  options: CommentOptions
): CommentedEnv {
  const lines = content.split('\n');
  const keysCommented: string[] = [];

  const commented = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return line;

      const key = trimmed.slice(0, eqIndex).trim();

      const matchesKey = options.keys && options.keys.includes(key);
      const matchesPattern = options.pattern && options.pattern.test(key);

      if (matchesKey || matchesPattern) {
        keysCommented.push(key);
        return `# ${line}`;
      }

      return line;
    })
    .join('\n');

  return { original: content, commented, keysCommented };
}

/**
 * Uncomments lines in an env file that match specified keys or pattern
 */
export function uncommentKeys(
  content: string,
  options: CommentOptions
): CommentedEnv {
  const lines = content.split('\n');
  const keysCommented: string[] = [];

  const commented = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('#')) return line;

      const withoutHash = trimmed.replace(/^#\s*/, '');
      const eqIndex = withoutHash.indexOf('=');
      if (eqIndex === -1) return line;

      const key = withoutHash.slice(0, eqIndex).trim();

      const matchesKey = options.keys && options.keys.includes(key);
      const matchesPattern = options.pattern && options.pattern.test(key);

      if (matchesKey || matchesPattern) {
        keysCommented.push(key);
        return withoutHash;
      }

      return line;
    })
    .join('\n');

  return { original: content, commented, keysCommented };
}

export function saveCommented(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function formatCommentResult(result: CommentedEnv, action: 'comment' | 'uncomment'): string {
  if (result.keysCommented.length === 0) {
    return `No keys were ${action}ed.`;
  }
  const verb = action === 'comment' ? 'Commented out' : 'Uncommented';
  return `${verb} ${result.keysCommented.length} key(s): ${result.keysCommented.join(', ')}`;
}
