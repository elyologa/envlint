import { parseExportArgs } from './export-command';

describe('parseExportArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseExportArgs(['node', 'envlint']);
    expect(args.envFile).toBe('.env');
    expect(args.format).toBe('json');
    expect(args.output).toBeUndefined();
    expect(args.redact).toBe(false);
  });

  it('parses --env flag', () => {
    const args = parseExportArgs(['node', 'envlint', '--env', '.env.production']);
    expect(args.envFile).toBe('.env.production');
  });

  it('parses --format flag', () => {
    const args = parseExportArgs(['node', 'envlint', '--format', 'yaml']);
    expect(args.format).toBe('yaml');
  });

  it('parses --output flag', () => {
    const args = parseExportArgs(['node', 'envlint', '--output', 'out/env.json']);
    expect(args.output).toBe('out/env.json');
  });

  it('parses --redact flag', () => {
    const args = parseExportArgs(['node', 'envlint', '--redact']);
    expect(args.redact).toBe(true);
  });

  it('throws on invalid format', () => {
    expect(() =>
      parseExportArgs(['node', 'envlint', '--format', 'toml'])
    ).toThrow('Invalid format "toml"');
  });

  it('parses all flags together', () => {
    const args = parseExportArgs([
      'node', 'envlint',
      '--env', '.env.staging',
      '--format', 'shell',
      '--output', 'out/env.sh',
      '--redact',
    ]);
    expect(args.envFile).toBe('.env.staging');
    expect(args.format).toBe('shell');
    expect(args.output).toBe('out/env.sh');
    expect(args.redact).toBe(true);
  });
});
