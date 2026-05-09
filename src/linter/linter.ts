import { EnvSchema, SchemaEntry } from '../schema/types';

export interface LintIssue {
  key: string;
  severity: 'error' | 'warn' | 'info';
  message: string;
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
  valid: boolean;
}

export function lintEnv(
  envVars: Record<string, string>,
  schema: EnvSchema,
  file: string
): LintResult {
  const issues: LintIssue[] = [];

  for (const [key, entry] of Object.entries(schema)) {
    const value = envVars[key];

    if (value === undefined || value === '') {
      if (entry.required) {
        issues.push({ key, severity: 'error', message: `Missing required key: ${key}` });
      } else {
        issues.push({ key, severity: 'warn', message: `Optional key not set: ${key}` });
      }
      continue;
    }

    if (entry.type === 'number' && isNaN(Number(value))) {
      issues.push({ key, severity: 'error', message: `Expected number for key: ${key}, got: "${value}"` });
    }

    if (entry.type === 'boolean' && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      issues.push({ key, severity: 'error', message: `Expected boolean for key: ${key}, got: "${value}"` });
    }

    if (entry.pattern) {
      const regex = new RegExp(entry.pattern);
      if (!regex.test(value)) {
        issues.push({ key, severity: 'error', message: `Value for ${key} does not match pattern: ${entry.pattern}` });
      }
    }

    if (entry.allowedValues && !entry.allowedValues.includes(value)) {
      issues.push({
        key,
        severity: 'error',
        message: `Invalid value for ${key}: "${value}". Allowed: ${entry.allowedValues.join(', ')}`
      });
    }
  }

  for (const key of Object.keys(envVars)) {
    if (!schema[key]) {
      issues.push({ key, severity: 'warn', message: `Undeclared key not in schema: ${key}` });
    }
  }

  return { file, issues, valid: !issues.some(i => i.severity === 'error') };
}

export function formatLintResult(result: LintResult): string {
  const lines: string[] = [`Lint result for ${result.file}: ${result.valid ? 'PASS' : 'FAIL'}\n`];
  if (result.issues.length === 0) {
    lines.push('  No issues found.');
  } else {
    for (const issue of result.issues) {
      const icon = issue.severity === 'error' ? '✖' : issue.severity === 'warn' ? '⚠' : 'ℹ';
      lines.push(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
    }
  }
  return lines.join('\n');
}
