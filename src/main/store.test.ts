import { describe, expect, it } from 'vitest';
import { TaskStore } from './store';

describe('TaskStore', () => {
  it('adds and deletes tasks', () => {
    const store = new TaskStore();
    const first = store.add({ name: 'First', description: 'One' });
    expect(first).toHaveLength(1);
    expect(first[0].name).toBe('First');

    const second = store.add({ name: 'Second', description: 'Two' });
    expect(second).toHaveLength(2);

    const afterDelete = store.delete(second[1].id);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].name).toBe('First');
  });
});
