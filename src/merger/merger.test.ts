import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvContent, mergeEnvs, mergeEnvFiles, formatMergeResult } from './merger';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `envlint-merge-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseEnvContent', () => {
  it('parses key=value pairs', () => {
    const result = parseEnvContent('FOO=bar\nBAZ=qux\n');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const result = parseEnvContent('# comment\n\nFOO=bar\n');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('handles values with equals signs', () => {
    const result = parseEnvContent('URL=http://x.com?a=1\n');
    expect(result).toEqual({ URL: 'http://x.com?a=1' });
  });
});

describe('mergeEnvs', () => {
  const base = { FOO: 'foo', BAR: 'bar' };
  const incoming = { BAR: 'new-bar', BAZ: 'baz' };

  it('adds new keys from incoming', () => {
    const result = mergeEnvs(base, incoming);
    expect(result.added).toContain('BAZ');
    expect(result.merged.BAZ).toBe('baz');
  });

  it('skips existing keys when overwrite is false', () => {
    const result = mergeEnvs(base, incoming, { overwrite: false });
    expect(result.skipped).toContain('BAR');
    expect(result.merged.BAR).toBe('bar');
  });

  it('overwrites existing keys when overwrite is true', () => {
    const result = mergeEnvs(base, incoming, { overwrite: true });
    expect(result.overwritten).toContain('BAR');
    expect(result.merged.BAR).toBe('new-bar');
  });

  it('does not mutate base object', () => {
    mergeEnvs(base, incoming, { overwrite: true });
    expect(base.BAR).toBe('bar');
  });
});

describe('mergeEnvFiles', () => {
  it('merges two env files and writes output', () => {
    const baseFile = writeTempEnv('FOO=foo\nBAR=bar\n');
    const incomingFile = writeTempEnv('BAR=new-bar\nBAZ=baz\n');
    const outputFile = path.join(os.tmpdir(), `envlint-merge-out-${Date.now()}.env`);
    const result = mergeEnvFiles(baseFile, incomingFile, outputFile);
    expect(result.added).toContain('BAZ');
    expect(result.skipped).toContain('BAR');
    const written = fs.readFileSync(outputFile, 'utf-8');
    expect(written).toContain('FOO=foo');
    expect(written).toContain('BAZ=baz');
    fs.unlinkSync(baseFile);
    fs.unlinkSync(incomingFile);
    fs.unlinkSync(outputFile);
  });

  it('does not write file in dryRun mode', () => {
    const baseFile = writeTempEnv('FOO=foo\n');
    const incomingFile = writeTempEnv('BAR=bar\n');
    const outputFile = path.join(os.tmpdir(), `envlint-merge-dry-${Date.now()}.env`);
    mergeEnvFiles(baseFile, incomingFile, outputFile, { dryRun: true });
    expect(fs.existsSync(outputFile)).toBe(false);
    fs.unlinkSync(baseFile);
    fs.unlinkSync(incomingFile);
  });
});

describe('formatMergeResult', () => {
  it('formats merge result as readable string', () => {
    const result = { merged: {}, added: ['BAZ'], overwritten: ['BAR'], skipped: [] };
    const output = formatMergeResult(result);
    expect(output).toContain('Added');
    expect(output).toContain('BAZ');
    expect(output).toContain('Overwritten');
    expect(output).toContain('BAR');
  });
});
