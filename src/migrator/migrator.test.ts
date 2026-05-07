import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { migrateEnvFile, formatMigrationResult } from './migrator';

function writeTempEnv(content: string): string {
  const tmpFile = path.join(os.tmpdir(), `envlint-test-${Date.now()}.env`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  return tmpFile;
}

describe('migrateEnvFile', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renames keys according to the rename map', () => {
    const tmpFile = writeTempEnv('DB_HOST=localhost\nDB_PASS=secret\n');
    const result = migrateEnvFile(tmpFile, { DB_HOST: 'DATABASE_HOST', DB_PASS: 'DATABASE_PASSWORD' });
    expect(result.renamed).toHaveLength(2);
    expect(result.renamed[0]).toMatchObject({ oldKey: 'DB_HOST', newKey: 'DATABASE_HOST' });
    expect(result.renamed[1]).toMatchObject({ oldKey: 'DB_PASS', newKey: 'DATABASE_PASSWORD' });
    expect(result.written).toBe(true);
    const updated = fs.readFileSync(tmpFile, 'utf-8');
    expect(updated).toContain('DATABASE_HOST=localhost');
    expect(updated).toContain('DATABASE_PASSWORD=secret');
    fs.unlinkSync(tmpFile);
  });

  it('does not write in dry run mode', () => {
    const tmpFile = writeTempEnv('OLD_KEY=value\n');
    const original = fs.readFileSync(tmpFile, 'utf-8');
    const result = migrateEnvFile(tmpFile, { OLD_KEY: 'NEW_KEY' }, true);
    expect(result.renamed).toHaveLength(1);
    expect(result.written).toBe(false);
    expect(fs.readFileSync(tmpFile, 'utf-8')).toBe(original);
    fs.unlinkSync(tmpFile);
  });

  it('skips keys not in the rename map', () => {
    const tmpFile = writeTempEnv('KEEP_KEY=abc\n');
    const result = migrateEnvFile(tmpFile, { OTHER_KEY: 'NEW_KEY' });
    expect(result.renamed).toHaveLength(0);
    expect(result.written).toBe(false);
    fs.unlinkSync(tmpFile);
  });

  it('skips comment lines and blank lines', () => {
    const tmpFile = writeTempEnv('# comment\n\nFOO=bar\n');
    const result = migrateEnvFile(tmpFile, { FOO: 'BAR' });
    expect(result.renamed[0].newKey).toBe('BAR');
    fs.unlinkSync(tmpFile);
  });

  it('throws if file does not exist', () => {
    expect(() => migrateEnvFile('/nonexistent/.env', {})).toThrow('Env file not found');
  });
});

describe('formatMigrationResult', () => {
  it('formats a result with renames', () => {
    const result = {
      file: '.env',
      renamed: [{ key: 'OLD', oldKey: 'OLD', newKey: 'NEW', value: 'val' }],
      skipped: [],
      written: true,
    };
    const output = formatMigrationResult(result);
    expect(output).toContain('OLD -> NEW');
    expect(output).toContain('Changes written to disk.');
  });

  it('formats a dry run result', () => {
    const result = { file: '.env', renamed: [], skipped: [], written: false };
    const output = formatMigrationResult(result);
    expect(output).toContain('No keys were renamed.');
    expect(output).toContain('Dry run');
  });
});
