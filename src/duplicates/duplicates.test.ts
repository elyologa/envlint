import { findDuplicates, checkDuplicatesInFile, formatDuplicateResult } from './duplicates';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `envlint-test-${Date.now()}.env`);
  fs.writeFileSync(file, content);
  return file;
}

describe('findDuplicates', () => {
  it('returns empty array for no duplicates', () => {
    const result = findDuplicates('FOO=1\nBAR=2\nBAZ=3');
    expect(result).toEqual([]);
  });

  it('detects a single duplicate key', () => {
    const result = findDuplicates('FOO=1\nBAR=2\nFOO=3');
    expect(result).toContainEqual({ key: 'FOO', lines: [1, 3] });
  });

  it('detects multiple duplicate keys', () => {
    const result = findDuplicates('FOO=1\nBAR=2\nFOO=3\nBAR=4');
    expect(result).toHaveLength(2);
  });

  it('handles keys duplicated more than twice', () => {
    const result = findDuplicates('FOO=1\nFOO=2\nFOO=3');
    expect(result).toContainEqual({ key: 'FOO', lines: [1, 2, 3] });
  });

  it('ignores comments and blank lines', () => {
    const result = findDuplicates('# comment\nFOO=1\n\nBAR=2');
    expect(result).toEqual([]);
  });
});

describe('checkDuplicatesInFile', () => {
  it('reads file and returns duplicates', () => {
    const file = writeTempEnv('KEY=1\nKEY=2');
    const result = checkDuplicatesInFile(file);
    expect(result).toContainEqual({ key: 'KEY', lines: [1, 2] });
    fs.unlinkSync(file);
  });

  it('returns empty for file with no duplicates', () => {
    const file = writeTempEnv('A=1\nB=2');
    const result = checkDuplicatesInFile(file);
    expect(result).toEqual([]);
    fs.unlinkSync(file);
  });
});

describe('formatDuplicateResult', () => {
  it('reports no duplicates found', () => {
    const output = formatDuplicateResult('test.env', []);
    expect(output).toContain('No duplicate keys found');
  });

  it('lists duplicate keys with line numbers', () => {
    const output = formatDuplicateResult('test.env', [{ key: 'FOO', lines: [1, 4] }]);
    expect(output).toContain('FOO');
    expect(output).toContain('1');
    expect(output).toContain('4');
  });

  it('includes filename in output', () => {
    const output = formatDuplicateResult('my.env', [{ key: 'BAR', lines: [2, 5] }]);
    expect(output).toContain('my.env');
  });
});
