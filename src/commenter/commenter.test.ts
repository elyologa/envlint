import { commentKeys, uncommentKeys, formatCommentResult } from './commenter';

const sampleEnv = `# App config
APP_NAME=myapp
APP_ENV=production
DEBUG=false
SECRET_KEY=abc123
DB_HOST=localhost
DB_PASSWORD=secret
`;

describe('commentKeys', () => {
  it('comments out keys by name', () => {
    const result = commentKeys(sampleEnv, { keys: ['DEBUG', 'APP_ENV'] });
    expect(result.keysCommented).toEqual(['APP_ENV', 'DEBUG']);
    expect(result.commented).toContain('# APP_ENV=production');
    expect(result.commented).toContain('# DEBUG=false');
    expect(result.commented).toContain('APP_NAME=myapp');
  });

  it('comments out keys matching a pattern', () => {
    const result = commentKeys(sampleEnv, { pattern: /^DB_/ });
    expect(result.keysCommented).toContain('DB_HOST');
    expect(result.keysCommented).toContain('DB_PASSWORD');
    expect(result.commented).toContain('# DB_HOST=localhost');
    expect(result.commented).toContain('# DB_PASSWORD=secret');
  });

  it('does not double-comment already commented lines', () => {
    const result = commentKeys(sampleEnv, { keys: ['APP_NAME'] });
    const lines = result.commented.split('\n');
    const commentedLine = lines.find((l) => l.includes('APP_NAME=myapp'));
    expect(commentedLine).toBe('# APP_NAME=myapp');
  });

  it('returns empty keysCommented when no keys match', () => {
    const result = commentKeys(sampleEnv, { keys: ['NONEXISTENT'] });
    expect(result.keysCommented).toHaveLength(0);
    expect(result.commented).toBe(sampleEnv);
  });

  it('preserves original content', () => {
    const result = commentKeys(sampleEnv, { keys: ['DEBUG'] });
    expect(result.original).toBe(sampleEnv);
  });
});

describe('uncommentKeys', () => {
  const commentedEnv = `# APP_NAME=myapp
# DEBUG=false
APP_ENV=production
`;

  it('uncomments keys by name', () => {
    const result = uncommentKeys(commentedEnv, { keys: ['APP_NAME'] });
    expect(result.keysCommented).toEqual(['APP_NAME']);
    expect(result.commented).toContain('APP_NAME=myapp');
    expect(result.commented).not.toMatch(/^APP_NAME/);
  });

  it('uncomments keys matching a pattern', () => {
    const result = uncommentKeys(commentedEnv, { pattern: /^DEBUG/ });
    expect(result.keysCommented).toContain('DEBUG');
    expect(result.commented).toContain('DEBUG=false');
  });

  it('leaves non-matching commented lines untouched', () => {
    const result = uncommentKeys(commentedEnv, { keys: ['APP_NAME'] });
    expect(result.commented).toContain('# DEBUG=false');
  });
});

describe('formatCommentResult', () => {
  it('formats comment result with keys', () => {
    const result = { original: '', commented: '', keysCommented: ['KEY1', 'KEY2'] };
    expect(formatCommentResult(result, 'comment')).toBe('Commented out 2 key(s): KEY1, KEY2');
  });

  it('formats uncomment result', () => {
    const result = { original: '', commented: '', keysCommented: ['KEY1'] };
    expect(formatCommentResult(result, 'uncomment')).toBe('Uncommented 1 key(s): KEY1');
  });

  it('returns message when no keys affected', () => {
    const result = { original: '', commented: '', keysCommented: [] };
    expect(formatCommentResult(result, 'comment')).toBe('No keys were commented.');
  });
});
