import { describe, expect, it } from 'vitest';
import type { Task } from '../shared/types';
import type { TaskPersistence } from './taskPersistence';
import { TaskStore } from './store';

class MemoryPersistence implements TaskPersistence {
  private tasks: Task[] = [];

  async load(): Promise<Task[]> {
    return this.tasks;
  }

  async save(tasks: Task[]): Promise<void> {
    this.tasks = tasks;
  }
}

describe('TaskStore', () => {
  it('adds and deletes tasks', async () => {
    const store = new TaskStore(new MemoryPersistence());
    await store.ready;
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
});
