import { findDuplicates, formatDuplicateResult, DuplicateResult } from './duplicates';

describe('findDuplicates', () => {
  it('returns empty array when no duplicates exist', () => {
    const content = 'FOO=bar\nBAZ=qux\nHELLO=world';
    expect(findDuplicates(content)).toEqual([]);
  });

  it('detects a single duplicate key', () => {
    const content = 'FOO=first\nBAR=baz\nFOO=second';
    const result = findDuplicates(content);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('FOO');
    expect(result[0].lines).toEqual([1, 3]);
    expect(result[0].values).toEqual(['first', 'second']);
  });

  it('detects multiple duplicate keys', () => {
    const content = 'A=1\nB=2\nA=3\nB=4';
    const result = findDuplicates(content);
    expect(result).toHaveLength(2);
    const keys = result.map((r) => r.key).sort();
    expect(keys).toEqual(['A', 'B']);
  });

  it('ignores comment lines', () => {
    const content = '# FOO=ignored\nFOO=real';
    expect(findDuplicates(content)).toEqual([]);
  });

  it('ignores blank lines', () => {
    const content = 'FOO=bar\n\nFOO=baz';
    const result = findDuplicates(content);
    expect(result).toHaveLength(1);
    expect(result[0].lines).toEqual([1, 3]);
  });

  it('handles keys appearing three times', () => {
    const content = 'X=1\nX=2\nX=3';
    const result = findDuplicates(content);
    expect(result[0].lines).toEqual([1, 2, 3]);
    expect(result[0].values).toEqual(['1', '2', '3']);
  });
});

describe('formatDuplicateResult', () => {
  it('formats a clean result', () => {
    const result: DuplicateResult = { file: '.env', duplicates: [] };
    expect(formatDuplicateResult(result)).toBe('✔ No duplicate keys found in .env');
  });

  it('formats a result with duplicates', () => {
    const result: DuplicateResult = {
      file: '.env',
      duplicates: [
        { key: 'API_KEY', lines: [2, 5], values: ['abc', 'xyz'] },
      ],
    };
    const output = formatDuplicateResult(result);
    expect(output).toContain('✖ Found 1 duplicate key(s) in .env');
    expect(output).toContain('API_KEY');
    expect(output).toContain('line 2: abc');
    expect(output).toContain('line 5: xyz');
  });
});
