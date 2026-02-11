import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { TaskStore } from './store';

const tempDirs: string[] = [];

function createTempStoragePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-store-'));
  tempDirs.push(dir);
  return path.join(dir, 'tasks.json');
}

describe('TaskStore', () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('adds and deletes tasks', () => {
    const store = new TaskStore();
    const first = store.add({
      name: 'First',
      description: 'One',
      effort: 'LOW',
      impact: 'HIGH',
    });
    expect(first).toHaveLength(1);
    expect(first[0].name).toBe('First');
    expect(first[0].effort).toBe('LOW');
    expect(first[0].impact).toBe('HIGH');

    const second = store.add({
      name: 'Second',
      description: 'Two',
      effort: 'HIGH',
      impact: 'LOW',
    });
    expect(second).toHaveLength(2);

    const afterDelete = store.delete(second[1].id);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].name).toBe('First');
  });

  it('persists tasks to disk and reloads them', async () => {
    const storagePath = createTempStoragePath();
    const store = new TaskStore({ storagePath });
    store.add({
      name: 'Persisted',
      description: 'Saved',
      effort: 'LOW',
      impact: 'HIGH',
    });

    await store.flush();

    const raw = fs.readFileSync(storagePath, 'utf8');
    const parsed = JSON.parse(raw) as { tasks: Array<{ name: string }> };
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0].name).toBe('Persisted');

    const reloaded = new TaskStore({ storagePath });
    const tasks = reloaded.list();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('Persisted');
  });

  it('handles corrupted storage by starting empty', () => {
    const storagePath = createTempStoragePath();
    fs.writeFileSync(storagePath, '{not:json', 'utf8');
    const store = new TaskStore({ storagePath });
    expect(store.list()).toHaveLength(0);
  });

  it('recovers from a backup when the primary file is missing', async () => {
    const storagePath = createTempStoragePath();
    const store = new TaskStore({ storagePath });
    store.add({
      name: 'Backup',
      description: 'Restore',
      effort: 'LOW',
      impact: 'HIGH',
    });

    await store.flush();

    const backupPath = `${storagePath}.bak`;
    fs.renameSync(storagePath, backupPath);
    expect(fs.existsSync(storagePath)).toBe(false);

    const reloaded = new TaskStore({ storagePath });
    expect(reloaded.list()).toHaveLength(1);
    expect(reloaded.list()[0].name).toBe('Backup');
    expect(fs.existsSync(storagePath)).toBe(true);
  });

  it('recovers from a temp file when the primary file is corrupt', () => {
    const storagePath = createTempStoragePath();
    const tempPath = `${storagePath}.tmp`;
    const task = {
      id: 'temp-id',
      name: 'Temp',
      description: 'Recover',
      effort: 'LOW',
      impact: 'HIGH',
    };

    fs.writeFileSync(storagePath, '{not:json', 'utf8');
    fs.writeFileSync(tempPath, JSON.stringify({ version: 1, tasks: [task] }, null, 2), 'utf8');

    const reloaded = new TaskStore({ storagePath });
    expect(reloaded.list()).toHaveLength(1);
    expect(reloaded.list()[0].name).toBe('Temp');
    expect(fs.existsSync(storagePath)).toBe(true);
    expect(fs.existsSync(tempPath)).toBe(false);
  });
});
