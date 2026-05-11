import { exportEnv, formatExportResult } from './exporter';

const sampleEnv: Record<string, string> = {
  APP_NAME: 'envlint',
  DB_PASSWORD: 'supersecret',
  PORT: '3000',
  API_KEY: 'abc123',
};

describe('exportEnv', () => {
  it('exports as JSON', () => {
    const result = exportEnv(sampleEnv, { format: 'json' });
    const parsed = JSON.parse(result.content);
    expect(parsed.APP_NAME).toBe('envlint');
    expect(parsed.PORT).toBe('3000');
    expect(result.keyCount).toBe(4);
  });

  it('redacts sensitive keys in JSON', () => {
    const result = exportEnv(sampleEnv, { format: 'json', redactSensitive: true });
    const parsed = JSON.parse(result.content);
    expect(parsed.DB_PASSWORD).toBe('***REDACTED***');
    expect(parsed.API_KEY).toBe('***REDACTED***');
    expect(parsed.APP_NAME).toBe('envlint');
  });

  it('exports as YAML', () => {
    const result = exportEnv(sampleEnv, { format: 'yaml' });
    expect(result.content).toContain('APP_NAME: "envlint"');
    expect(result.content).toContain('PORT: "3000"');
  });

  it('exports as shell', () => {
    const result = exportEnv(sampleEnv, { format: 'shell' });
    expect(result.content).toContain('export APP_NAME="envlint"');
    expect(result.content).toContain('export PORT="3000"');
  });

  it('exports as docker', () => {
    const result = exportEnv(sampleEnv, { format: 'docker' });
    expect(result.content).toContain('--env APP_NAME="envlint"');
  });

  it('uses custom sensitive keys', () => {
    const result = exportEnv(sampleEnv, {
      format: 'json',
      redactSensitive: true,
      sensitiveKeys: ['name'],
    });
    const parsed = JSON.parse(result.content);
    expect(parsed.APP_NAME).toBe('***REDACTED***');
    expect(parsed.DB_PASSWORD).toBe('supersecret');
  });

  it('throws on unsupported format', () => {
    expect(() =>
      exportEnv(sampleEnv, { format: 'csv' as any })
    ).toThrow('Unsupported export format: csv');
  });
});

describe('formatExportResult', () => {
  it('includes key count and format in output', () => {
    const result = exportEnv(sampleEnv, { format: 'json' });
    const output = formatExportResult(result);
    expect(output).toContain('Exported 4 key(s) as JSON');
  });
});
