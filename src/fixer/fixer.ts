import * as fs from 'fs';
import * as path from 'path';
import { EnvSchema } from '../schema/types';
import { ValidationResult } from '../schema/validator';

export interface FixResult {
  filePath: string;
  addedKeys: string[];
  skippedKeys: string[];
}

/**
 * Generates a placeholder value for a given schema field type.
 */
export function getPlaceholderValue(type: string, example?: string): string {
  if (example !== undefined) return example;
  switch (type) {
    case 'number': return '0';
    case 'boolean': return 'false';
    case 'url': return 'https://example.com';
    case 'email': return 'user@example.com';
    default: return 'CHANGE_ME';
  }
}

/**
 * Appends missing keys with placeholder values to a .env file.
 */
export function fixEnvFile(
  filePath: string,
  schema: EnvSchema,
  validationResult: ValidationResult,
  dryRun = false
): FixResult {
  const missingKeys = validationResult.errors
    .filter(e => e.type === 'missing')
    .map(e => e.key);

  const addedKeys: string[] = [];
  const skippedKeys: string[] = [];

  if (missingKeys.length === 0) {
    return { filePath, addedKeys, skippedKeys };
  }

  const lines: string[] = [];

  for (const key of missingKeys) {
    const fieldDef = schema.fields[key];
    if (!fieldDef) {
      skippedKeys.push(key);
      continue;
    }
    const placeholder = getPlaceholderValue(fieldDef.type, fieldDef.example);
    const comment = fieldDef.description ? `# ${fieldDef.description}\n` : '';
    lines.push(`${comment}${key}=${placeholder}`);
    addedKeys.push(key);
  }

  if (!dryRun && addedKeys.length > 0) {
    const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    const separator = existing.endsWith('\n') || existing === '' ? '' : '\n';
    const appended = separator + lines.join('\n') + '\n';
    fs.writeFileSync(filePath, existing + appended, 'utf-8');
  }

  return { filePath, addedKeys, skippedKeys };
}

/**
 * Formats a FixResult into a human-readable string.
 */
export function formatFixResult(result: FixResult, dryRun = false): string {
  const prefix = dryRun ? '[DRY RUN] ' : '';
  if (result.addedKeys.length === 0 && result.skippedKeys.length === 0) {
    return `${prefix}No changes needed for ${result.filePath}.`;
  }
  const lines: string[] = [`${prefix}Fix results for ${result.filePath}:`];
  if (result.addedKeys.length > 0) {
    lines.push(`  Added (${result.addedKeys.length}): ${result.addedKeys.join(', ')}`);
  }
  if (result.skippedKeys.length > 0) {
    lines.push(`  Skipped (${result.skippedKeys.length}): ${result.skippedKeys.join(', ')}`);
  }
  return lines.join('\n');
}
