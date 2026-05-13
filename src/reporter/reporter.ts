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

/**
 * Merges multiple reports into a single combined report.
 * Useful when validating several .env files in one run.
 */
export function mergeReports(reports: Report[]): Report {
  const envFile = reports.map((r) => r.envFile).join(', ');
  const errors = reports.flatMap((r) => r.errors);
  const warnings = reports.flatMap((r) => r.warnings);
  const passed = reports.every((r) => r.passed);
  const summary = passed
    ? `✔ All files passed validation (${warnings.length} warning(s))`
    : `✖ Validation failed: ${errors.length} error(s), ${warnings.length} warning(s) across ${reports.length} file(s)`;

  return { envFile, passed, errors, warnings, summary };
}
