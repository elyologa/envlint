import { EnvSchema, SchemaEntry } from '../schema/types';

export interface AuditIssue {
  key: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface AuditResult {
  file: string;
  issues: AuditIssue[];
  score: number;
}

function auditEntry(key: string, entry: SchemaEntry, value: string | undefined): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (value === undefined || value === '') {
    if (entry.required) {
      issues.push({ key, severity: 'error', message: `Missing required key: ${key}` });
    } else {
      issues.push({ key, severity: 'info', message: `Optional key not set: ${key}` });
    }
    return issues;
  }

  if (entry.type === 'url') {
    try {
      new URL(value);
    } catch {
      issues.push({ key, severity: 'error', message: `Invalid URL format for key: ${key}` });
    }
  }

  if (entry.type === 'number' && isNaN(Number(value))) {
    issues.push({ key, severity: 'error', message: `Expected number for key: ${key}` });
  }

  if (entry.type === 'boolean' && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
    issues.push({ key, severity: 'warning', message: `Ambiguous boolean value for key: ${key}` });
  }

  if (entry.pattern && !new RegExp(entry.pattern).test(value)) {
    issues.push({ key, severity: 'error', message: `Value does not match pattern for key: ${key}` });
  }

  return issues;
}

export function auditEnv(
  envFile: string,
  env: Record<string, string>,
  schema: EnvSchema
): AuditResult {
  const issues: AuditIssue[] = [];

  for (const [key, entry] of Object.entries(schema)) {
    issues.push(...auditEntry(key, entry, env[key]));
  }

  for (const key of Object.keys(env)) {
    if (!schema[key]) {
      issues.push({ key, severity: 'warning', message: `Undeclared key not in schema: ${key}` });
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const totalKeys = Object.keys(schema).length || 1;
  const score = Math.max(0, Math.round(100 - (errorCount * 20 + warningCount * 5) / totalKeys * totalKeys));

  return { file: envFile, issues, score };
}

export function formatAuditResult(result: AuditResult): string {
  const lines: string[] = [
    `Audit: ${result.file} (score: ${result.score}/100)`,
    ''
  ];

  if (result.issues.length === 0) {
    lines.push('  ✓ No issues found');
    return lines.join('\n');
  }

  for (const issue of result.issues) {
    const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
    lines.push(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
  }

  return lines.join('\n');
}
