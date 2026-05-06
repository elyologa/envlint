import { ValidationResult } from '../schema/validator';

export type ReportFormat = 'text' | 'json';

export interface ReportOptions {
  format?: ReportFormat;
  verbose?: boolean;
}

export interface Report {
  envFile: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
}

export function generateReport(
  envFile: string,
  results: ValidationResult[],
  options: ReportOptions = {}
): Report {
  const { verbose = false } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const result of results) {
    if (!result.valid) {
      const prefix = `[${result.key}]`;
      for (const error of result.errors) {
        if (error.severity === 'error') {
          errors.push(`${prefix} ${error.message}`);
        } else {
          warnings.push(`${prefix} ${error.message}`);
        }
      }
    } else if (verbose) {
      warnings.push(`[${result.key}] OK`);
    }
  }

  const passed = errors.length === 0;
  const summary = passed
    ? `✔ ${envFile} passed validation (${warnings.length} warning(s))`
    : `✖ ${envFile} failed validation: ${errors.length} error(s), ${warnings.length} warning(s)`;

  return { envFile, passed, errors, warnings, summary };
}

export function formatReport(report: Report, format: ReportFormat = 'text'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  const lines: string[] = [report.summary];

  if (report.errors.length > 0) {
    lines.push('\nErrors:');
    report.errors.forEach((e) => lines.push(`  • ${e}`));
  }

  if (report.warnings.length > 0) {
    lines.push('\nWarnings:');
    report.warnings.forEach((w) => lines.push(`  ~ ${w}`));
  }

  return lines.join('\n');
}
