import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { Task } from '../shared/types';
import { TaskStore } from './store';
import { JsonTaskPersistence } from './taskPersistence';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'tasks-'));
}

describe('JsonTaskPersistence', () => {
  it('round-trips tasks to disk', async () => {
    const dir = await makeTempDir();
    const filePath = path.join(dir, 'tasks.json');
    const persistence = new JsonTaskPersistence(filePath);

    const tasks: Task[] = [
      {
        id: 'task-1',
        name: 'First',
        description: 'One',
        effort: 'LOW',
        impact: 'HIGH',
      },
    ];

    await persistence.save(tasks);

    const loaded = await persistence.load();
    expect(loaded).toEqual(tasks);
  });

  it('rehydrates tasks across store instances', async () => {
    const dir = await makeTempDir();
    const filePath = path.join(dir, 'tasks.json');
    const persistence = new JsonTaskPersistence(filePath);

    const store = new TaskStore(persistence);
    await store.ready;
    store.add({
      name: 'Persisted',
      description: 'Stored task',
      effort: 'LOW',
      impact: 'HIGH',
    });
    await store.waitForPersistence();

    const restored = new TaskStore(persistence);
    await restored.ready;
    const tasks = restored.list();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('Persisted');
  });
});
