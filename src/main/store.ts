import { randomUUID } from 'crypto';
import type { EffortLevel, ImpactLevel, Task, TaskInput } from '../shared/types';

export class TaskStore {
  private tasks = new Map<string, Task>();

  list(): Task[] {
    return Array.from(this.tasks.values());
  }

  add(input: TaskInput): Task[] {
    const name = input.name.trim();
    const description = input.description.trim();
    const effort = normalizeLevel(input.effort, 'LOW');
    const impact = normalizeLevel(input.impact, 'HIGH');
    if (!name) {
      throw new Error('Task name is required.');
    }

    const task: Task = {
      id: randomUUID(),
      name,
      description,
      effort,
      impact,
    };

    this.tasks.set(task.id, task);
    return this.list();
  }

  delete(id: string): Task[] {
    this.tasks.delete(id);
    return this.list();
  }
}

function normalizeLevel(
  value: EffortLevel | ImpactLevel | undefined,
  fallback: EffortLevel | ImpactLevel,
): EffortLevel | ImpactLevel {
  if (value === 'LOW' || value === 'HIGH') {
    return value;
  }
  return fallback;
}
