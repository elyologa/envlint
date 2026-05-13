import { renameKeys, formatRenameResult, parseEnvContent } from './renamer';

const sampleEnv = `# App config
DB_HOST=localhost
DB_PORT=5432
APP_SECRET=supersecret
`;

describe('parseEnvContent', () => {
  it('parses key-value pairs', () => {
    const result = parseEnvContent(sampleEnv);
    expect(result['DB_HOST']).toBe('localhost');
    expect(result['DB_PORT']).toBe('5432');
    expect(result['APP_SECRET']).toBe('supersecret');
  });

  it('ignores comments and blank lines', () => {
    const result = parseEnvContent(sampleEnv);
    expect(Object.keys(result)).not.toContain('#');
  });
});

describe('renameKeys', () => {
  it('renames an existing key', () => {
    const result = renameKeys(sampleEnv, [{ from: 'DB_HOST', to: 'DATABASE_HOST' }]);
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0]).toEqual({ from: 'DB_HOST', to: 'DATABASE_HOST' });
    expect(result.content).toContain('DATABASE_HOST=localhost');
    expect(result.content).not.toContain('DB_HOST=');
  });

  it('skips rule when source key is missing', () => {
    const result = renameKeys(sampleEnv, [{ from: 'MISSING_KEY', to: 'NEW_KEY' }]);
    expect(result.skipped).toHaveLength(1);
    expect(result.applied).toHaveLength(0);
  });

  it('skips rule when target key already exists', () => {
    const result = renameKeys(sampleEnv, [{ from: 'DB_HOST', to: 'DB_PORT' }]);
    expect(result.skipped).toHaveLength(1);
    expect(result.applied).toHaveLength(0);
  });

  it('applies multiple rename rules', () => {
    const result = renameKeys(sampleEnv, [
      { from: 'DB_HOST', to: 'DATABASE_HOST' },
      { from: 'DB_PORT', to: 'DATABASE_PORT' },
    ]);
    expect(result.applied).toHaveLength(2);
    expect(result.content).toContain('DATABASE_HOST=localhost');
    expect(result.content).toContain('DATABASE_PORT=5432');
  });

  it('preserves comments and structure', () => {
    const result = renameKeys(sampleEnv, [{ from: 'DB_HOST', to: 'DATABASE_HOST' }]);
    expect(result.content).toContain('# App config');
  });
});

describe('formatRenameResult', () => {
  it('formats applied and skipped rules', () => {
    const result = renameKeys(sampleEnv, [
      { from: 'DB_HOST', to: 'DATABASE_HOST' },
      { from: 'MISSING', to: 'ALSO_MISSING' },
    ]);
    const output = formatRenameResult(result);
    expect(output).toContain('Renamed keys:');
    expect(output).toContain('DB_HOST → DATABASE_HOST');
    expect(output).toContain('Skipped');
    expect(output).toContain('MISSING → ALSO_MISSING');
  });

  it('shows message when no rules provided', () => {
    const output = formatRenameResult({ applied: [], skipped: [], content: '' });
    expect(output).toContain('No rename rules provided.');
  });
});
