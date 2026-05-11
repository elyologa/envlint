import * as fs from 'fs';
import * as path from 'path';

export type ExportFormat = 'json' | 'yaml' | 'shell' | 'docker';

export interface ExportOptions {
  format: ExportFormat;
  redactSensitive?: boolean;
  sensitiveKeys?: string[];
}

export interface ExportResult {
  format: ExportFormat;
  content: string;
  keyCount: number;
}

const DEFAULT_SENSITIVE_KEYS = ['password', 'secret', 'token', 'key', 'private'];

function isSensitive(key: string, sensitiveKeys: string[]): boolean {
  const lower = key.toLowerCase();
  return sensitiveKeys.some((s) => lower.includes(s));
}

function maybeRedact(key: string, value: string, options: ExportOptions): string {
  const keys = options.sensitiveKeys ?? DEFAULT_SENSITIVE_KEYS;
  if (options.redactSensitive && isSensitive(key, keys)) {
    return '***REDACTED***';
  }
  return value;
}

export function exportEnv(
  env: Record<string, string>,
  options: ExportOptions
): ExportResult {
  const entries = Object.entries(env);
  const keyCount = entries.length;
  let content: string;

  switch (options.format) {
    case 'json': {
      const obj: Record<string, string> = {};
      for (const [k, v] of entries) {
        obj[k] = maybeRedact(k, v, options);
      }
      content = JSON.stringify(obj, null, 2);
      break;
    }
    case 'yaml': {
      const lines = entries.map(
        ([k, v]) => `${k}: "${maybeRedact(k, v, options)}"`
      );
      content = lines.join('\n');
      break;
    }
    case 'shell': {
      const lines = entries.map(
        ([k, v]) => `export ${k}="${maybeRedact(k, v, options)}"`
      );
      content = lines.join('\n');
      break;
    }
    case 'docker': {
      const lines = entries.map(
        ([k, v]) => `--env ${k}="${maybeRedact(k, v, options)}"`
      );
      content = lines.join(' \\
  ');
      break;
    }
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  return { format: options.format, content, keyCount };
}

export function saveExport(result: ExportResult, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.content, 'utf-8');
}

export function formatExportResult(result: ExportResult): string {
  return `Exported ${result.keyCount} key(s) as ${result.format.toUpperCase()}.\n${result.content}`;
}
