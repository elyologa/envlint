import { parseLintArgs } from './lint-command';

describe('parseLintArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseLintArgs([]);
    expect(args.envFile).toBe('.env');
    expect(args.schemaFile).toBe('envlint.schema.json');
    expect(args.strict).toBe(false);
    expect(args.json).toBe(false);
  });

  it('parses --env flag', () => {
    const args = parseLintArgs(['--env', '.env.production']);
    expect(args.envFile).toBe('.env.production');
  });

  it('parses --schema flag', () => {
    const args = parseLintArgs(['--schema', 'custom.schema.json']);
    expect(args.schemaFile).toBe('custom.schema.json');
  });

  it('parses --strict flag', () => {
    const args = parseLintArgs(['--strict']);
    expect(args.strict).toBe(true);
  });

  it('parses --json flag', () => {
    const args = parseLintArgs(['--json']);
    expect(args.json).toBe(true);
  });

  it('parses multiple flags together', () => {
    const args = parseLintArgs(['--env', '.env.test', '--schema', 'test.schema.json', '--strict', '--json']);
    expect(args.envFile).toBe('.env.test');
    expect(args.schemaFile).toBe('test.schema.json');
    expect(args.strict).toBe(true);
    expect(args.json).toBe(true);
  });
});
