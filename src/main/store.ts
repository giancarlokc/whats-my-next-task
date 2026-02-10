import { randomUUID } from 'crypto';
import type { Task, TaskInput } from '../shared/types';

export class TaskStore {
  private tasks = new Map<string, Task>();

  list(): Task[] {
    return Array.from(this.tasks.values());
  }

  add(input: TaskInput): Task[] {
    const name = input.name.trim();
    const description = input.description.trim();
    if (!name) {
      throw new Error('Task name is required.');
    }

    const task: Task = {
      id: randomUUID(),
      name,
      description,
    };

    this.tasks.set(task.id, task);
    return this.list();
  }

  delete(id: string): Task[] {
    this.tasks.delete(id);
    return this.list();
  }
}
