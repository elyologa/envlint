import { generateReport, formatReport } from './reporter';
import { ValidationResult } from '../schema/validator';

const makeResult = (
  key: string,
  valid: boolean,
  errors: { message: string; severity: 'error' | 'warning' }[] = []
): ValidationResult => ({ key, valid, errors });

describe('generateReport', () => {
  it('returns passed=true when all results are valid', () => {
    const results = [makeResult('PORT', true), makeResult('HOST', true)];
    const report = generateReport('.env', results);
    expect(report.passed).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.warnings).toHaveLength(0);
  });

  it('returns passed=false when there are errors', () => {
    const results = [
      makeResult('PORT', false, [{ message: 'must be a number', severity: 'error' }]),
    ];
    const report = generateReport('.env', results);
    expect(report.passed).toBe(false);
    expect(report.errors).toContain('[PORT] must be a number');
  });

  it('separates errors from warnings', () => {
    const results = [
      makeResult('PORT', false, [
        { message: 'must be a number', severity: 'error' },
        { message: 'consider using a port above 1024', severity: 'warning' },
      ]),
    ];
    const report = generateReport('.env', results);
    expect(report.errors).toHaveLength(1);
    expect(report.warnings).toHaveLength(1);
  });

  it('includes verbose OK messages when verbose=true', () => {
    const results = [makeResult('API_KEY', true)];
    const report = generateReport('.env', results, { verbose: true });
    expect(report.warnings).toContain('[API_KEY] OK');
  });

  it('does not include OK messages when verbose=false', () => {
    const results = [makeResult('API_KEY', true)];
    const report = generateReport('.env', results, { verbose: false });
    expect(report.warnings).not.toContain('[API_KEY] OK');
  });

  it('summary reflects failure state', () => {
    const results = [
      makeResult('DB_URL', false, [{ message: 'missing required key', severity: 'error' }]),
    ];
    const report = generateReport('.env.production', results);
    expect(report.summary).toMatch(/failed validation/);
    expect(report.summary).toMatch(/.env.production/);
  });

  it('summary reflects passing state', () => {
    const results = [makeResult('PORT', true), makeResult('HOST', true)];
    const report = generateReport('.env', results);
    expect(report.summary).toMatch(/passed/);
  });
});

describe('formatReport', () => {
  it('formats as JSON when format=json', () => {
    const results = [makeResult('PORT', true)];
    const report = generateReport('.env', results);
    const output = formatReport(report, 'json');
    const parsed = JSON.parse(output);
    expect(parsed.envFile).toBe('.env');
    expect(parsed.passed).toBe(true);
  });

  it('formats as text by default', () => {
    const results = [
      makeResult('PORT', false, [{ message: 'must be a number', severity: 'error' }]),
    ];
    const report = generateReport('.env', results);
    const output = formatReport(report);
    expect(output).toContain('Errors:');
    expect(output).toContain('must be a number');
  });
});
