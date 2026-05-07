import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  takeSnapshot,
  saveSnapshot,
  loadSnapshot,
  compareSnapshots,
  formatSnapshotCompare,
} from './snapshotter';

function writeTempEnv(content: string): string {
  const tmp = path.join(os.tmpdir(), `test-${Date.now()}.env`);
  fs.writeFileSync(tmp, content, 'utf-8');
  return tmp;
}

describe('takeSnapshot', () => {
  it('captures all key-value pairs from an env file', () => {
    const envPath = writeTempEnv('APP_NAME=envlint\nPORT=3000\n');
    const snap = takeSnapshot(envPath);
    expect(snap.entries['APP_NAME']).toBe('envlint');
    expect(snap.entries['PORT']).toBe('3000');
    expect(snap.timestamp).toBeTruthy();
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  it('round-trips a snapshot to disk', () => {
    const envPath = writeTempEnv('KEY=value\n');
    const snap = takeSnapshot(envPath);
    const outPath = path.join(os.tmpdir(), `snap-${Date.now()}.json`);
    saveSnapshot(snap, outPath);
    const loaded = loadSnapshot(outPath);
    expect(loaded.entries).toEqual(snap.entries);
    expect(loaded.timestamp).toBe(snap.timestamp);
  });
});

describe('compareSnapshots', () => {
  const base = {
    timestamp: '2024-01-01T00:00:00.000Z',
    envFile: '/app/.env',
    entries: { A: '1', B: '2', C: '3' },
  };

  it('detects added keys', () => {
    const after = { ...base, entries: { A: '1', B: '2', C: '3', D: '4' } };
    const result = compareSnapshots(base, after);
    expect(result.added).toContain('D');
  });

  it('detects removed keys', () => {
    const after = { ...base, entries: { A: '1', B: '2' } };
    const result = compareSnapshots(base, after);
    expect(result.removed).toContain('C');
  });

  it('detects changed values', () => {
    const after = { ...base, entries: { A: '1', B: 'changed', C: '3' } };
    const result = compareSnapshots(base, after);
    expect(result.changed[0]).toEqual({ key: 'B', from: '2', to: 'changed' });
  });

  it('reports unchanged keys', () => {
    const result = compareSnapshots(base, base);
    expect(result.unchanged).toEqual(['A', 'B', 'C']);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });
});

describe('formatSnapshotCompare', () => {
  it('shows no changes message when identical', () => {
    const snap = { timestamp: 't', envFile: 'f', entries: { X: '1' } };
    const result = compareSnapshots(snap, snap);
    const output = formatSnapshotCompare(result, snap, snap);
    expect(output).toContain('No changes detected.');
  });

  it('includes added/removed/changed sections', () => {
    const before = { timestamp: 't1', envFile: 'f', entries: { A: '1', B: '2' } };
    const after = { timestamp: 't2', envFile: 'f', entries: { A: 'new', C: '3' } };
    const result = compareSnapshots(before, after);
    const output = formatSnapshotCompare(result, before, after);
    expect(output).toContain('+ C');
    expect(output).toContain('- B');
    expect(output).toContain('~ A');
  });
});
