import { describe, expect, it } from 'vitest';
import { TaskStore } from './store';

describe('TaskStore', () => {
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
});
